import { Request, Response } from 'express';
import { JobService } from '@/services';
import { auditQueue, pub } from '@/services/queue';

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

/**
 * 流式审计逻辑（SSE）- 改造后：只负责入队和转发日志
 */
export const handleAuditStream = async (req: Request, res: Response) => {
  try {
    const { address, jobId } = req.query as { address: string; jobId: string };

    if (!address || !jobId) {
      return res.status(400).json({ error: 'Missing address or jobId' });
    }

    // 检查用户认证（假设中间件已挂载 req.user）
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (address.toLowerCase() !== req.user.sub.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden: address mismatch' });
    }

    // 检查 job 是否存在并属于该用户
    const job = await JobService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.user?.address?.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden: job mismatch' });
    }

    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 创建 Redis 订阅者（每个客户端独立）
    const subscriber = pub.duplicate(); // 使用 pub 的副本，避免干扰发布
    const channel = `job:${jobId}:log`;
    await subscriber.subscribe(channel);

    // 收到消息立即通过 SSE 发送
    subscriber.on('message', (ch, message) => {
      if (!res.writableEnded) {
        res.write(`data: ${message}\n\n`);
      }
    });

    // 客户端断开时清理订阅
    req.on('close', () => {
      subscriber.unsubscribe(channel);
      subscriber.quit();
      console.log(`[SSE] 客户端断开，jobId=${jobId}`);
    });

    // 将任务加入队列（使用 jobId 作为 Bull 的 jobId，保证幂等）
    await auditQueue.add({ address, jobId }, { jobId });

    // 发送初始消息，告知客户端任务已提交
    res.write(
      `data: ${JSON.stringify({ agent: 'System', status: 'thinking', content: '任务已提交，等待处理...' })}\n\n`
    );

    // 注意：不结束响应，保持连接打开
  } catch (error: any) {
    console.error('[handleAuditStream] 捕获异常:', error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error.message || 'Internal server error' });
    }
    // 如果已经发送了 SSE 头，尝试写入错误消息并关闭
    try {
      res.write(
        `data: ${JSON.stringify({ agent: 'Watchdog', status: 'error', content: `服务器内部错误: ${error.message}` })}\n\n`
      );
      res.end();
    } catch {
      // 忽略写入错误
    }
  }
};
