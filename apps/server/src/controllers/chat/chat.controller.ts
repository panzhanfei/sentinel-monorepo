import { Request, Response } from 'express';
import { JobService } from '@/services';
import { HttpError, sendSuccess } from '@/utils/apiResponse';
import {
  hasCompletedScanWithData,
  isClearlyOffTopicQuestion,
} from '@/modules/chat/guards';
import { createChatSseHeartbeat } from '@/modules/chat/sseHeartbeat';
import { createChatSsePublish } from '@/modules/chat/ssePublish';
import { ChatService } from '@/modules/chat/service';
import { runChatAgents } from '@/modules/chat/stream';

/** SSE 保活：注释行过代理；JSON 供前端忽略，不写入对话 */
const CHAT_SSE_HEARTBEAT_MS = 20_000;

export const createSession = async (req: Request, res: Response) => {
  const { address } = req.body;

  if (!address) {
    throw new HttpError(400, 'address is required', 'ADDRESS_REQUIRED');
  }
  const session = await ChatService.getOrCreateSession(
    req.user.sub.toLowerCase(),
    address
  );

  sendSuccess(res, { sessionId: session.id });
};

export const chatStream = async (req: Request, res: Response) => {
  const { sessionId, message } = req.query as {
    sessionId: string;
    message: string;
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sseHeartbeat = createChatSseHeartbeat(res, CHAT_SSE_HEARTBEAT_MS);
  sseHeartbeat.start();
  res.once('close', () => {
    sseHeartbeat.stop();
  });

  const userId = req.user!.sub;

  const publish = createChatSsePublish({ res, sessionId, userId });

  try {
    const userMsg = await ChatService.addMessage(
      sessionId,
      userId,
      'user',
      'USER',
      message
    );
    if (!userMsg) {
      res.write(
        `data: ${JSON.stringify({ agent: 'System', status: 'error', content: '会话不存在或无权访问' })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
      return;
    }

    const session = await ChatService.getThreadContext(sessionId);
    if (!session) {
      res.write(
        `data: ${JSON.stringify({ agent: 'System', status: 'error', content: '会话不存在' })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
      return;
    }

    const latestJob = await JobService.getLatestCompletedJob(session.address);
    if (!hasCompletedScanWithData(latestJob)) {
      await publish(
        'System',
        'done',
        '当前没有可用于分析的扫描数据：请先完成该地址的扫描，且扫描结果中需存在链上授权记录。'
      );
      res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
      return;
    }

    if (isClearlyOffTopicQuestion(message)) {
      await publish(
        'System',
        'done',
        '当前助手仅支持该地址授权与安全扫描相关的问题，请描述您的安全或扫描方面的疑问。'
      );
      res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
      return;
    }

    await runChatAgents(message, publish);

    res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
  } catch (e: unknown) {
    const content = e instanceof Error ? e.message : 'Unknown error';
    res.write(
      `data: ${JSON.stringify({ agent: 'System', status: 'error', content })}\n\n`
    );
    res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
  } finally {
    sseHeartbeat.stop();
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const limitRaw = req.query.limit as string | undefined;
  const beforeIso = req.query.before as string | undefined;

  if (!sessionId) {
    throw new HttpError(400, 'sessionId required', 'SESSION_ID_REQUIRED');
  }

  const limit = Math.min(50, Math.max(1, Number(limitRaw) || 5));

  let before: Date | undefined;
  if (beforeIso !== undefined && beforeIso !== '') {
    const createdAt = new Date(beforeIso);
    if (Number.isNaN(createdAt.getTime())) {
      throw new HttpError(400, 'Invalid before', 'INVALID_BEFORE');
    }
    before = createdAt;
  }

  const userId = req.user!.sub;
  const page = await ChatService.getMessagesPage(sessionId, userId, {
    limit,
    before,
  });

  if (page === null) {
    throw new HttpError(404, 'Thread not found', 'THREAD_NOT_FOUND');
  }

  sendSuccess(res, {
    messages: page.messages.map((m) => ({
      id: m.id,
      role: m.role,
      agent: m.agent,
      content: m.content,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    })),
    hasMore: page.hasMore,
  });
};
