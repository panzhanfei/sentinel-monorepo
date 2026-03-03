// 同样复用后端项目的 Redis 配置
import { redis } from '@/client';

export async function startScannerWorker() {
  console.log('🚀 Sentinel Worker: 监听队列中...');

  while (true) {
    try {
      // 1. BRPOP (Blocking Right Pop)
      // 这里的 0 表示：如果没有任务，Worker 就挂起（不占CPU），直到有任务进来立即唤醒
      const result = await redis.brpop('sentinel:queue', 0);
      if (!result) continue;

      const address = result[1];
      const taskKey = `sentinel:task:${address}`;

      // 2. 标记任务开始
      await redis.hset(taskKey, 'status', 'processing');
      console.log(`[Worker] 开始深度扫描: ${address}`);

      // 3. 模拟深度扫描步骤 (后续这里就是你的 AI 逻辑入口)
      for (let i = 1; i <= 5; i++) {
        await new Promise((res) => setTimeout(res, 1500)); // 每步 1.5 秒
        const progress = i * 20;

        // 实时更新进度，前端可以通过另一个接口查到这个百分比
        await redis.hset(taskKey, 'progress', progress.toString());
      }

      // 4. 标记完成并存入时间戳
      await redis.hset(taskKey, {
        status: 'completed',
        progress: '100',
        completedAt: Date.now().toString(),
      });

      console.log(`[Worker] 扫描完成: ${address}`);
    } catch (error) {
      console.error('Worker Error:', error);
      // 防止报错导致死循环崩溃，等 1 秒重试
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}
