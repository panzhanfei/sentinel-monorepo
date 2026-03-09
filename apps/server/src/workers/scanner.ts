import { redis } from '@/client';
import { prisma } from '@sentinel/database';
import { createPublicClient, http, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

// 初始化 viem 客户端 (建议使用你的 RPC 节点，如 Alchemy/Infura)
const client = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.QUICKNODE_RPC_URL || 'https://cloudflare-eth.com'
  ),
});

export async function startWorker() {
  console.log('🚀 Sentinel Worker 已启动，正在通过 pnpm 环境监听任务...');

  while (true) {
    try {
      // 1. 获取任务 (Redis 依然是消息中心)
      const task = await redis.brpop('sentinel:scan_queue', 0);
      if (!task) continue;

      const { jobId, address } = JSON.parse(task[1]);
      const cacheKey = `sentinel:task:${address.toLowerCase()}`;
      console.log(`[${jobId}] 正在审计地址: ${address}`);

      try {
        // --- 阶段 1: 更新为运行中 ---
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'RUNNING', progress: 15 },
        });
        await redis.hset(cacheKey, { status: 'RUNNING', progress: '15' });

        // --- 阶段 2: 执行真实扫描 (接入 Viem) ---
        // 并行查询余额和交易计数
        const [balance, txCount] = await Promise.all([
          client.getBalance({ address: address as `0x${string}` }),
          client.getTransactionCount({ address: address as `0x${string}` }),
        ]);

        await prisma.job.update({
          where: { id: jobId },
          data: { progress: 60 },
        });
        await redis.hset(cacheKey, { progress: '60' });

        // 基础风险逻辑
        const isNewWallet = txCount < 5;
        const scanResult = {
          eth_balance: formatEther(balance),
          tx_count: txCount,
          risk: isNewWallet ? 'MEDIUM' : 'LOW',
          details: isNewWallet
            ? '新地址交易较少，建议注意授权安全'
            : '活跃地址，信用记录良好',
          timestamp: Date.now(),
        };

        // --- 阶段 3: 结算完成 (同步更新 DB 和 Redis) ---
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'COMPLETED', progress: 100, result: scanResult },
        });

        // 确保 Redis 状态与前端 scanStatus 枚举一致
        await redis.hset(cacheKey, {
          status: 'COMPLETED',
          progress: '100',
          risk: scanResult.risk,
        });
        await redis.expire(cacheKey, 3600); // 1小时后自动清理缓存

        console.log(`[${jobId}] 链上数据抓取成功`);
      } catch (innerError) {
        console.error(`[${jobId}] 扫描任务执行失败:`, innerError);
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'FAILED', error: (innerError as Error).message },
        });
        await redis.hset(cacheKey, { status: 'FAILED', progress: '0' });
      }
    } catch (outerError) {
      console.error('Redis 队列监听异常:', outerError);
      await new Promise((res) => setTimeout(res, 1000)); // 避免重试过快
    }
  }
}
