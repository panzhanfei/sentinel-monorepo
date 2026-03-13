import { Request, Response } from 'express';
import { batchAuditAllowances } from '@sentinel/security-sdk';
import {
  streamScanWithDeepSeek,
  streamAuditWithDeepSeek,
  streamGenerateFinalReport,
  sendTelegramAlert,
  JobService,
} from '@/services';

// 扩展 Request 类型，添加 user 属性（由路由中间件挂载）
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role?: string;
      };
    }
  }
}

/**
 * 创建扫描任务（立即返回 jobId）
 */
export const startScan = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    // 权限控制：只能为自己创建扫描（依赖中间件挂载的 user）
    if (!req.user || address.toLowerCase() !== req.user.sub.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden: address mismatch' });
    }

    const job = await JobService.createJob(address);
    res.json({ jobId: job.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * 获取指定 job 的状态（只允许访问自己的任务）
 */
export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID required' });
    }

    const job = await JobService.getJobById(jobId as string);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // ✅ 权限校验：确保任务属于当前用户
    if (
      !req.user ||
      job.user?.address?.toLowerCase() !== req.user.sub.toLowerCase()
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 获取指定地址的最新任务（只允许查询自己的地址）
 */
export const getLatestJob = async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    if (
      !req.user ||
      address.toString().toLowerCase() !== req.user.sub.toLowerCase()
    ) {
      return res.status(403).json({ error: 'Forbidden: address mismatch' });
    }

    const job = await JobService.getLatestJob(address.toString());
    if (!job) {
      return res.status(404).json({ error: 'No job found for this address' });
    }
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 流式审计逻辑（SSE）
 */
export const handleAuditStream = async (req: Request, res: Response) => {
  console.log(`[🙃handleAuditStream] 收到请求, query:`, req.query);

  try {
    const { address, jobId } = req.query as { address: string; jobId: string };

    if (!address || !jobId) {
      console.log('[🙃handleAuditStream] 缺少参数');
      return res.status(400).json({ error: 'Missing address or jobId' });
    }

    // 检查用户认证（假设中间件已挂载 req.user）
    if (!req.user) {
      console.log('[🙃handleAuditStream] 未认证');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (address.toLowerCase() !== req.user.sub.toLowerCase()) {
      console.log('[🙃handleAuditStream] 地址不匹配');
      return res.status(403).json({ error: 'Forbidden: address mismatch' });
    }

    // 检查 job 是否存在并属于该用户
    const job = await JobService.getJobById(jobId);
    if (!job) {
      console.log(`[🙃handleAuditStream] Job 不存在: ${jobId}`);
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.user?.address?.toLowerCase() !== address.toLowerCase()) {
      console.log('[🙃handleAuditStream] Job 不属于该用户');
      return res.status(403).json({ error: 'Forbidden: job mismatch' });
    }

    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let isClosed = false;
    req.on('close', () => {
      isClosed = true;
      console.log('[🙃handleAuditStream] 客户端断开连接');
    });

    const send = (agent: string, status: string, content?: string) => {
      if (!isClosed) {
        res.write(`data: ${JSON.stringify({ agent, status, content })}\n\n`);
      }
    };

    console.log(
      '[🙃handleAuditStream] 开始处理，jobId:',
      jobId,
      'address:',
      address
    );

    // 0. SDK 获取链上数据
    send('System', 'thinking', '正在提取链上授权数据...');
    const allowances = await batchAuditAllowances(address as any);
    if (isClosed) return;
    await JobService.updateJob(jobId, { progress: 20, status: 'RUNNING' });

    // 1. Agent 1: DeepSeek 扫描（流式）
    send('Scanner (DeepSeek)', 'thinking', '正在扫描合约授权模式...');
    let fullReport1 = '';
    const report1 = await streamScanWithDeepSeek(
      `Address: ${address}, Data: ${JSON.stringify(allowances)}`,
      (chunk) => {
        fullReport1 += chunk;
        send('Scanner (DeepSeek)', 'thinking', chunk);
      }
    );
    if (isClosed) return;
    await JobService.updateJob(jobId, { progress: 45 });
    send('Scanner (DeepSeek)', 'done', '初扫完成');

    // 2. Agent 2: DeepSeek 复核（流式）
    send('Auditor (DeepSeek)', 'thinking', '正在复核扫描结果并排除误报...');
    let fullReport2 = '';
    const report2 = await streamAuditWithDeepSeek(
      fullReport1, // 使用累积的完整初扫报告
      (chunk) => {
        fullReport2 += chunk;
        send('Auditor (DeepSeek)', 'thinking', chunk);
      }
    );
    if (isClosed) return;
    await JobService.updateJob(jobId, { progress: 70 });
    send('Auditor (DeepSeek)', 'done', '复核完成');

    // 3. Agent 3: DeepSeek 最终报告生成（流式）
    send('Decision (DeepSeek)', 'thinking', '正在生成最终风险评级...');
    let finalReport = '';
    await streamGenerateFinalReport(fullReport2, (chunk) => {
      finalReport += chunk;
      send('Decision (DeepSeek)', 'thinking', chunk);
    });
    if (isClosed) return;

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
    send('Decision (DeepSeek)', 'done', finalReport);

    // 4. Agent 4: 预警
    if (riskLevel === 'HIGH') {
      send('Alerter', 'active', '检测到高危风险，正在推送 Telegram 预警...');
      await sendTelegramAlert(`检测到高危地址: ${address}\n\n${finalReport}`);
    }

    res.write('event: end\ndata: 审计全链路完成\n\n');
    res.end();
    console.log('[🙃handleAuditStream] 处理完成');
  } catch (error: any) {
    console.error('[🙃handleAuditStream] 捕获异常:', error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error.message || 'Internal server error' });
    }

    const { jobId } = req.query as { jobId?: string };
    if (jobId) {
      await JobService.updateJob(jobId, {
        status: 'FAILED',
        error: error.message,
      }).catch(console.error);
    }

    try {
      res.write(
        `data: ${JSON.stringify({ agent: 'Watchdog', status: 'error', content: `链路异常: ${error.message}` })}\n\n`
      );
      res.end();
    } catch {
      // 忽略写入错误
    }
  }
};
