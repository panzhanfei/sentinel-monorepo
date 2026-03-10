import { redis } from '@/client';
import { prisma } from '@sentinel/database';
import { batchAuditAllowances } from '@sentinel/security-sdk';
import { createPublicClient, http, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

// 初始化 viem 客户端
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
      // 1. 获取任务 (从 Redis 阻塞式弹出)
      const task = await redis.brpop('sentinel:scan_queue', 0);
      if (!task) continue;

      const { jobId, address } = JSON.parse(task[1]);
      const cacheKey = `sentinel:task:${address.toLowerCase()}`;
      console.log(`[${jobId}] 正在深度审计地址: ${address}`);

      try {
        // --- 阶段 1: 标记启动 (15%) ---
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'RUNNING', progress: 15 },
        });
        await redis.hset(cacheKey, { status: 'RUNNING', progress: '15' });

        // --- 阶段 2: 链上基础数据抓取 (40%) ---
        const [balance, txCount] = await Promise.all([
          client.getBalance({ address: address as `0x${string}` }),
          client.getTransactionCount({ address: address as `0x${string}` }),
        ]);

        await prisma.job.update({
          where: { id: jobId },
          data: { progress: 40 },
        });
        await redis.hset(cacheKey, { progress: '40' });

        // --- 阶段 3: 深度授权审计 (接入 Security SDK) (80%) ---
        // 这是今天最硬核的任务：调用你刚刚写的 Multicall 逻辑
        const allowanceAudit = await batchAuditAllowances(
          address as `0x${string}`
        );

        await prisma.job.update({
          where: { id: jobId },
          data: { progress: 80 },
        });
        await redis.hset(cacheKey, { progress: '80' });

        // --- 阶段 4: 风险引擎评估 ---
        // 这里我们可以预留给明天的 AI，现在先做基础逻辑判定
        const hasHighRiskAllowance = allowanceAudit.some(
          (a) => parseFloat(a.allowance) > 1000000 // 假设大于 100w 的授权为高危
        );

        const isNewWallet = txCount < 5;
        let finalRisk = 'LOW';
        if (isNewWallet) finalRisk = 'MEDIUM';
        if (hasHighRiskAllowance) finalRisk = 'HIGH';

        const scanResult = {
          eth_balance: formatEther(balance),
          tx_count: txCount,
          allowances: allowanceAudit, // 这里存入了所有代币的授权详情
          risk: finalRisk,
          details: {
            isNewWallet,
            riskCount: allowanceAudit.filter((a) => parseFloat(a.allowance) > 0)
              .length,
            message: hasHighRiskAllowance
              ? '检测到无限授权，存在资产被盗风险！'
              : '授权状态良好。',
          },
          timestamp: Date.now(),
        };

        // --- 阶段 5: 结算完成 (100%) ---
        // 注意：Prisma 的 JSON 字段会自动处理 scanResult 对象
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETED',
            progress: 100,
            result: scanResult as any, // 强制断言，Prisma 会处理 JSONB
          },
        });

        await redis.hset(cacheKey, {
          status: 'COMPLETED',
          progress: '100',
          risk: finalRisk,
        });
        await redis.expire(cacheKey, 3600);

        console.log(`[${jobId}] 深度审计成功 - 风险等级: ${finalRisk}`);
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
      await new Promise((res) => setTimeout(res, 2000)); // 延长重试，保护 RPC
    }
  }
}
