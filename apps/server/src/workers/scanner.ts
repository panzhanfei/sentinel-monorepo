import { Job } from 'bull';
import { batchAuditAllowances } from '@sentinel/security-sdk';
import {
  JobService,
  sendTelegramAlert,
  auditQueue,
  pub,
  withHeartbeat,
  scanWithDeepSeek,
  auditWithDeepSeek,
  generateFinalReport,
} from '@/services';

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

export async function processJob(job: Job) {
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
      3n
    );
    await JobService.updateJob(jobId, { progress: 20 });
    await job.progress(20);

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
      },
    });
    await job.progress(100);

    publishLog('Decision (DeepSeek)', 'done', finalReport);

    if (riskLevel === 'HIGH') {
      publishLog(
        'Alerter',
        'active',
        '检测到高危风险，正在推送 Telegram 预警...'
      );
      await sendTelegramAlert(`检测到高危地址: ${address}\n\n${finalReport}`);
    }

    // 修改点：使用 publishLog 发送结束标记，而不是原始文本
    publishLog('System', 'stream_end', '审计完成');

    console.log(`[Worker] jobId=${jobId} 完成`);
  } catch (error: any) {
    console.error(`[Worker] jobId=${jobId} 失败:`, error);
    await JobService.updateJob(jobId, {
      status: 'FAILED',
      error: error.message,
    });
    publishLog('Watchdog', 'error', `任务失败: ${error.message}`);
    throw error; // 触发 Bull 重试
  }
}

// 启动 Worker
export async function startScan() {
  auditQueue.process(async (job) => await processJob(job));

  auditQueue.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.id} 失败:`, err);
  });

  auditQueue.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} 完成`);
  });

  console.log('[Worker] 审计 Worker 已启动，等待任务...');
}
