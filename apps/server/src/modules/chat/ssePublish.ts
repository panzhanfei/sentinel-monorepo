import type { Response } from "express";
import { ChatService } from "./service";

export type IChatSsePublish = (
  agent: string,
  status: string,
  content: string,
) => void | Promise<void>;

export const createChatSsePublish = (args: {
  res: Response;
  sessionId: string;
  userId: string;
}): IChatSsePublish => {
  const { res, sessionId, userId } = args;

  return async (agent, status, content) => {
    const msg = JSON.stringify({ agent, status, content });

    res.write(`data: ${msg}\n\n`);

    await ChatService.recordAssistantStream(
      sessionId,
      userId,
      agent,
      content,
      status,
    );
  };
};
