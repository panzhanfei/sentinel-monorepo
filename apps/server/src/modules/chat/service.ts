import { randomUUID } from 'crypto';
import { prisma } from '@sentinel/database';

/** 每线程一条，等价于原 ChatSession 头；列表/展示时需排除 */
export const CHAT_THREAD_ANCHOR_AGENT = '__thread__';

function normUserId(userId: string) {
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

  static async createSession(userId: string, address: string) {
    const threadId = randomUUID();
    await prisma.chatMessage.create({
      data: {
        threadId,
        userId: normUserId(userId),
        address: address.toLowerCase(),
        role: 'system',
        agent: CHAT_THREAD_ANCHOR_AGENT,
        content: '',
        status: 'done',
      },
    });
    return { id: threadId, userId: normUserId(userId), address: address.toLowerCase() };
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

  static async getMessages(threadId: string) {
    return prisma.chatMessage.findMany({
      where: {
        threadId,
        agent: { not: CHAT_THREAD_ANCHOR_AGENT },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
