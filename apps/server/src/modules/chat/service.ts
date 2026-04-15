import { randomUUID } from 'crypto';
import { prisma } from '@sentinel/database';

/** 每线程一条，等价于原 ChatSession 头；列表/展示时需排除 */
export const CHAT_THREAD_ANCHOR_AGENT = '__thread__';

const normUserId = (userId: string) => {
  return userId.toLowerCase();
}

export type ChatThreadContext = {
  id: string;
  userId: string;
  address: string;
  createdAt: Date;
};

export class ChatService {
  /** threadId 对外仍称 sessionId */
  static async getThreadContext(threadId: string): Promise<ChatThreadContext | null> {
    const anchor = await prisma.chatMessage.findFirst({
      where: { threadId, agent: CHAT_THREAD_ANCHOR_AGENT },
    });
    if (!anchor) return null;
    return {
      id: threadId,
      userId: anchor.userId,
      address: anchor.address,
      createdAt: anchor.createdAt,
    };
  }

  /** 新建线程（仅内部或特殊场景使用） */
  static async createSession(userId: string, address: string) {
    const uid = normUserId(userId);
    const addr = address.toLowerCase();
    const threadId = randomUUID();
    await prisma.chatMessage.create({
      data: {
        threadId,
        userId: uid,
        address: addr,
        role: 'system',
        agent: CHAT_THREAD_ANCHOR_AGENT,
        content: '',
        status: 'done',
      },
    });
    return { id: threadId, userId: uid, address: addr };
  }

  /** 同一用户 + 链上地址复用最近一次会话，否则新建 */
  static async getOrCreateSession(userId: string, address: string) {
    const uid = normUserId(userId);
    const addr = address.toLowerCase();
    const anchor = await prisma.chatMessage.findFirst({
      where: {
        userId: uid,
        address: addr,
        agent: CHAT_THREAD_ANCHOR_AGENT,
      },
      orderBy: { createdAt: 'desc' },
      select: { threadId: true },
    });
    if (anchor) {
      return { id: anchor.threadId, userId: uid, address: addr };
    }
    return ChatService.createSession(userId, address);
  }

  static async addMessage(
    threadId: string,
    actorUserId: string,
    role: string,
    agent: string,
    content: string,
    status: string = 'done'
  ) {
    const anchor = await prisma.chatMessage.findFirst({
      where: { threadId, agent: CHAT_THREAD_ANCHOR_AGENT },
    });
    if (!anchor || anchor.userId !== normUserId(actorUserId)) {
      return null;
    }
    return prisma.chatMessage.create({
      data: {
        threadId,
        userId: anchor.userId,
        address: anchor.address,
        role,
        agent,
        content,
        status,
      },
    });
  }

  /**
   * 与 Job 类似：一次助手流式输出对应一行——thinking 时追加 content，done/error 时定稿；
   * 切换 agent 时自动将其它仍处于 thinking 的助手行置为 done。
   */
  static async recordAssistantStream(
    threadId: string,
    actorUserId: string,
    agent: string,
    content: string,
    status: string
  ) {
    const anchor = await prisma.chatMessage.findFirst({
      where: { threadId, agent: CHAT_THREAD_ANCHOR_AGENT },
    });
    if (!anchor || anchor.userId !== normUserId(actorUserId)) {
      return null;
    }

    const base = {
      threadId,
      userId: anchor.userId,
      address: anchor.address,
      role: 'assistant' as const,
      agent,
    };

    if (status === 'thinking') {
      await prisma.chatMessage.updateMany({
        where: {
          threadId,
          role: 'assistant',
          status: 'thinking',
          agent: { not: agent },
        },
        data: { status: 'done' },
      });

      const open = await prisma.chatMessage.findFirst({
        where: { threadId, role: 'assistant', agent, status: 'thinking' },
        orderBy: { createdAt: 'desc' },
      });

      if (open) {
        return prisma.chatMessage.update({
          where: { id: open.id },
          data: { content: open.content + content },
        });
      }

      return prisma.chatMessage.create({
        data: { ...base, content, status: 'thinking' },
      });
    }

    if (status === 'done' || status === 'error') {
      const open = await prisma.chatMessage.findFirst({
        where: { threadId, role: 'assistant', agent, status: 'thinking' },
        orderBy: { createdAt: 'desc' },
      });

      if (open) {
        const finalContent =
          content.length > 0 ? content : open.content;
        return prisma.chatMessage.update({
          where: { id: open.id },
          data: { status, content: finalContent },
        });
      }

      return prisma.chatMessage.create({
        data: { ...base, content, status },
      });
    }

    return prisma.chatMessage.create({
      data: { ...base, content, status },
    });
  }

  static async getMessages(threadId: string) {
    return prisma.chatMessage.findMany({
      where: {
        threadId,
        agent: { not: CHAT_THREAD_ANCHOR_AGENT },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** 按时间正序的一页；before 为当前列表中「最早一条」的 createdAt，取严格更早的消息 */
  static async getMessagesPage(
    threadId: string,
    actorUserId: string,
    opts: { limit: number; before?: Date }
  ) {
    const anchor = await prisma.chatMessage.findFirst({
      where: { threadId, agent: CHAT_THREAD_ANCHOR_AGENT },
    });
    if (!anchor || anchor.userId !== normUserId(actorUserId)) {
      return null;
    }

    const take = Math.min(50, Math.max(1, opts.limit));

    const rows = await prisma.chatMessage.findMany({
      where: {
        AND: [
          {
            threadId,
            agent: { not: CHAT_THREAD_ANCHOR_AGENT },
          },
          ...(opts.before ? [{ createdAt: { lt: opts.before } }] : []),
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      select: {
        id: true,
        role: true,
        agent: true,
        content: true,
        status: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    return { messages: page.reverse(), hasMore };
  }
}
