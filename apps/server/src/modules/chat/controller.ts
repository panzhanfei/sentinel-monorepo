import { Request, Response } from 'express';
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

  const publish = async (agent: string, status: string, content: string) => {
    const msg = JSON.stringify({ agent, status, content });

    res.write(`data: ${msg}\n\n`);

    await ChatService.addMessage(
      sessionId,
      'assistant',
      agent,
      content,
      status
    );
  };

  try {
    // 1. 保存用户输入
    await ChatService.addMessage(sessionId, 'user', 'USER', message);

    // 2. 执行 AI
    await runChatAgents(message, publish);

    res.write(`data: ${JSON.stringify({ status: 'end' })}\n\n`);
  } catch (e: any) {
    res.write(
      `data: ${JSON.stringify({ agent: 'System', status: 'error', content: e.message })}\n\n`
    );
  }
};
