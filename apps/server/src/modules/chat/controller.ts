import { Request, Response } from 'express';
import { JobService } from '@/services';
import {
  hasCompletedScanWithData,
  isClearlyOffTopicQuestion,
} from './guards';
import { ChatService } from './service';
import { runChatAgents } from './stream';

export const createSession = async (req: Request, res: Response) => {
  const { address } = req.body;

  if (!address) return res.status(401).json({ error: 'address?' });
  const session = await ChatService.createSession(
    req.user.sub.toLowerCase(),
    address
  );

  res.json({ sessionId: session.id });
};

export const chatStream = async (req: Request, res: Response) => {
  const { sessionId, message } = req.query as {
    sessionId: string;
    message: string;
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userId = req.user!.sub;

  const publish = async (agent: string, status: string, content: string) => {
    const msg = JSON.stringify({ agent, status, content });

    res.write(`data: ${msg}\n\n`);

    await ChatService.addMessage(
      sessionId,
      userId,
      'assistant',
      agent,
      content,
      status
    );
  };

  try {
    // 1. 保存用户输入
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

    // 2. 执行 AI（已有非空扫描数据且非明显闲聊/无关求助）
    await runChatAgents(message, publish);

    res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
  } catch (e: unknown) {
    const content = e instanceof Error ? e.message : 'Unknown error';
    res.write(
      `data: ${JSON.stringify({ agent: 'System', status: 'error', content })}\n\n`
    );
    res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
  }
};
