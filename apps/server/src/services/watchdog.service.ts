import { redis } from '@/client'; // 假设你已有 redis 实例

export function startWatchdog() {
  setInterval(async () => {
    try {
      // 1. 检查 Redis 心跳
      const pong = await redis.ping();
      // 2. 这里可以添加 AI 服务可用性检查等
      console.log(`[Watchdog] Heartbeat: Redis is ${pong}`);
    } catch (e) {
      console.error('[Watchdog] 发现系统异常!');
      // 异常时可以触发 Agent 4 报警
    }
  }, 30000); // 30秒一次
}
