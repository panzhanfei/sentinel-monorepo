/**
 * 心跳包装器：为AI流式调用提供超时监控和自动重启功能
 */

export interface HeartbeatOptions {
  timeoutMs?: number; // 无新chunk的超时时间，默认30秒
  maxRetries?: number; // 最大重启次数，默认2次
  onRestart?: (reason: string, attempt: number) => void;
}

export const withHeartbeat = <Args extends unknown[]>(name: string, aiFunc: (
    onChunk: (chunk: string) => void,
    signal: AbortSignal,
    ...args: Args
  ) => Promise<string>, options: HeartbeatOptions = {}) : (onChunk: (chunk: string) => void, ...args: Args) => Promise<string> => {
  const { timeoutMs = 30000, maxRetries = 2, onRestart } = options;

  return async (
    externalOnChunk: (chunk: string) => void,
    ...args: Args
  ): Promise<string> => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const abortController = new AbortController();
      let heartbeatTimer: NodeJS.Timeout | null = null;
      let finished = false;

      // 重置定时器
      const resetTimer = () => {
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        heartbeatTimer = setTimeout(() => {
          if (!finished) {
            console.warn(
              `[Heartbeat:${name}] 无响应超过 ${timeoutMs}ms，准备重启 (attempt ${attempt + 1}/${maxRetries + 1})`
            );
            abortController.abort(); // 取消当前请求
          }
        }, timeoutMs);
      };

      // 包装 onChunk：更新心跳时间 + 转发给外部
      const wrappedOnChunk = (chunk: string) => {
        resetTimer(); // 收到新块，重置计时器
        externalOnChunk(chunk);
      };

      resetTimer(); // 首次启动计时

      try {
        const result = await aiFunc(
          wrappedOnChunk,
          abortController.signal,
          ...args
        );
        finished = true;
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        return result; // 成功返回
      } catch (error: unknown) {
        finished = true;
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        const name = error instanceof Error ? error.name : '';
        const message =
          error instanceof Error ? error.message : String(error);
        // 如果是用户主动中止（AbortError），视为心跳超时，进行重试
        if (name === 'AbortError' || message.includes('aborted')) {
          attempt++;
          onRestart?.(`心跳超时`, attempt);
          console.log(
            `[Heartbeat:${name}] 因超时重启 (${attempt}/${maxRetries})`
          );
          continue; // 重试
        }
        // 其他错误直接抛出（可根据需要决定是否也重试）
        throw error;
      }
    }
    throw new Error(`${name} 已达到最大重启次数 (${maxRetries + 1})，任务失败`);
  };
}
