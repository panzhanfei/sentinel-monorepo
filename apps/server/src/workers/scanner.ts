import { Job } from 'bull';
import { batchAuditAllowances } from '@sentinel/security-sdk';
import {
  JobService,
  sendTelegramAlert,
  auditQueue,
  pub,
  sub,
  withHeartbeat,
  scanWithDeepSeek,
  auditWithDeepSeek,
  generateFinalReport,
} from '@/services';
import { prisma } from '@/client/prisma.client';
import type { Prisma } from '@sentinel/database';

// 创建带心跳监控的AI函数
const heartbeatScan = withHeartbeat('Scanner', scanWithDeepSeek, {
  timeoutMs: 45000, // 45秒无新chunk则重启
  maxRetries: 2,
  onRestart: (reason, attempt) => {
    console.log(`[Heartbeat] Scanner 重启 #${attempt}，原因：${reason}`);
  },
});

const heartbeatAudit = withHeartbeat('Auditor', auditWithDeepSeek, {
  timeoutMs: 45000,
  maxRetries: 2,
});

const heartbeatGenerate = withHeartbeat('Generator', generateFinalReport, {
  timeoutMs: 45000,
  maxRetries: 2,
});

const processJob = async (job: Job) => {
  const { address, jobId } = job.data;
  console.log(`[Worker] 开始处理 jobId=${jobId}, address=${address}`);

  const publishLog = (agent: string, status: string, content?: string) => {
    const msg = JSON.stringify({
      agent,
      status,
      content,
      timestamp: Date.now(),
    });
    pub.publish(`job:${jobId}:log`, msg);
  };

  try {
    await JobService.updateJob(jobId, { status: 'RUNNING', progress: 0 });
    await job.progress(0);

    // 1. 获取链上数据
    publishLog('System', 'thinking', '正在提取链上授权数据...');
    const allowances = await batchAuditAllowances(
      address,
      undefined,
      1000n,
      5n
    );
    await JobService.updateJob(jobId, { progress: 20 });
    await job.progress(20);

    if (!allowances.length) {
      const summary = '未检测到有效 ERC20 授权记录，已跳过 AI 分析以节省资源。';
      publishLog('System', 'done', summary);
      await JobService.updateJob(jobId, {
        progress: 100,
        status: 'COMPLETED',
        result: {
          risk: 'LOW',
          allowances: [],
          details: { message: summary, timestamp: Date.now() },
        } as unknown as Prisma.InputJsonValue,
      });
      await job.progress(100);
      publishLog('System', 'stream_end', '审计完成');
      console.log(`[Worker] jobId=${jobId} 无授权数据，跳过 AI`);
      return;
    }

    // 2. Agent 1: 初扫（带心跳）
    publishLog('Scanner (DeepSeek)', 'thinking', '正在扫描合约授权模式...');
    const report1 = await heartbeatScan(
      (chunk) => {
        publishLog('Scanner (DeepSeek)', 'thinking', chunk);
      },
      `Address: ${address}, Data: ${JSON.stringify(allowances)}`
    );
    await JobService.updateJob(jobId, { progress: 45 });
    await job.progress(45);

    // 3. Agent 2: 复核（带心跳）
    publishLog('Auditor (DeepSeek)', 'thinking', '正在复核扫描结果...');
    const report2 = await heartbeatAudit((chunk) => {
      publishLog('Auditor (DeepSeek)', 'thinking', chunk);
    }, report1);
    await JobService.updateJob(jobId, { progress: 70 });
    await job.progress(70);

    // 4. Agent 3: 最终报告（带心跳）
    publishLog('Decision (DeepSeek)', 'thinking', '正在生成最终风险评级...');
    const finalReport = await heartbeatGenerate((chunk) => {
      publishLog('Decision (DeepSeek)', 'thinking', chunk);
    }, report2);

    const riskLevel = finalReport.includes('HIGH') ? 'HIGH' : 'LOW';
    await JobService.updateJob(jobId, {
      progress: 100,
      status: 'COMPLETED',
      result: {
        risk: riskLevel,
        allowances,
        details: { message: finalReport, timestamp: Date.now() },
      } as unknown as Prisma.InputJsonValue,
    });
    await job.progress(100);

    publishLog('Decision (DeepSeek)', 'done', finalReport);

    if (riskLevel === 'HIGH') {
      publishLog(
        'Alerter',
        'active',
        '检测到高危风险，正在推送 Telegram 预警...'
      );
      const jobWithUser = await prisma.job.findUnique({
        where: { id: String(jobId) },
        include: { user: true },
      });
      const telegramChatId =
        (jobWithUser?.user as { telegramChatId?: string | null } | undefined)
          ?.telegramChatId ?? null;
      console.log('😀', telegramChatId);
      await sendTelegramAlert(
        `检测到高危地址: ${address}\n\n${finalReport}`,
        telegramChatId
      );
    }

    // 修改点：使用 publishLog 发送结束标记，而不是原始文本
    publishLog('System', 'stream_end', '审计完成');

    console.log(`[Worker] jobId=${jobId} 完成`);
  } catch (error: unknown) {
    console.error(`[Worker] jobId=${jobId} 失败:`, error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    await JobService.updateJob(jobId, {
      status: 'FAILED',
      error: message,
    });
    publishLog('Watchdog', 'error', `任务失败: ${message}`);
    throw error; // 触发 Bull 重试
  }
}

// 启动 Worker
export const startScan = async () => {
  auditQueue.process(async (job) => await processJob(job));

  auditQueue.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.id} 失败:`, err);
  });

  auditQueue.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} 完成`);
  });

  console.log('[Worker] 审计 Worker 已启动，等待任务...');
}

const ACTIVE_DRAIN_MS = 30_000;

export const stopScan = async () : Promise<void> => {
  try {
    await auditQueue.pause(true);
  } catch (e) {
    console.warn('[Worker] 暂停队列失败（仍将尝试关闭）:', e);
  }

  const deadline = Date.now() + ACTIVE_DRAIN_MS;
  try {
    while (Date.now() < deadline) {
      const active = await auditQueue.getActiveCount();
      if (active === 0) break;
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (e) {
    console.warn('[Worker] 等待活跃任务结束失败:', e);
  }

  try {
    await auditQueue.close();
  } catch (e) {
    console.warn('[Worker] 关闭队列失败:', e);
  }

  await Promise.allSettled([pub.quit(), sub.quit()]);
}
