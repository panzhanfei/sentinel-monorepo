import type { Response } from "express";

/**
 * 为 Chat SSE 创建可启停的心跳定时器；需在 `close` / `finally` 中调用 `stop`。
 */
export const createChatSseHeartbeat = (
  res: Response,
  intervalMs: number,
): { start: () => void; stop: () => void } => {
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  };

  const start = () => {
    heartbeatTimer = setInterval(() => {
      if (!res.writableEnded) {
        res.write(": sse-heartbeat\n\n");
        res.write(
          `data: ${JSON.stringify({ status: "heartbeat" })}\n\n`,
        );
      }
    }, intervalMs);
  };

  return { start, stop };
};
