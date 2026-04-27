import { Request, Response } from 'express';
import { JobService, UserService, auditQueue, pub } from '@/services';
import { HttpError, sendFailure, sendSuccess } from '@/utils';

/**
 * 创建扫描任务（立即返回 jobId）
 */
export const startScan = async (req: Request, res: Response) => {
  const { address } = req.body;
  if (!address) {
    throw new HttpError(400, 'Address required', 'ADDRESS_REQUIRED');
  }

  if (!req.user || address.toLowerCase() !== req.user.sub.toLowerCase()) {
    throw new HttpError(403, 'Forbidden: address mismatch', 'ADDRESS_MISMATCH');
  }

  const job = await JobService.createJob(address);
  sendSuccess(res, { jobId: job.id });
};

/**
 * 获取指定 job 的状态（只允许访问自己的任务）
 */
export const getJobStatus = async (req: Request, res: Response) => {
  const { jobId } = req.params;
  if (!jobId) {
    throw new HttpError(400, 'Job ID required', 'JOB_ID_REQUIRED');
  }

  const job = await JobService.getJobById(jobId as string);

  if (!job) {
    throw new HttpError(404, 'Job not found', 'JOB_NOT_FOUND');
  }

  if (
    !req.user ||
    job.user?.address?.toLowerCase() !== req.user.sub.toLowerCase()
  ) {
    throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  }

  sendSuccess(res, job);
};

/**
 * 获取指定地址的最新任务（只允许查询自己的地址）
 */
export const getLatestJob = async (req: Request, res: Response) => {
  const { address } = req.query;
  if (!address) {
    throw new HttpError(400, 'Address required', 'ADDRESS_REQUIRED');
  }

  if (
    !req.user ||
    address.toString().toLowerCase() !== req.user.sub.toLowerCase()
  ) {
    throw new HttpError(403, 'Forbidden: address mismatch', 'ADDRESS_MISMATCH');
  }

  const job = await JobService.getLatestJob(address.toString());
  if (!job) {
    throw new HttpError(404, 'No job found for this address', 'JOB_NOT_FOUND');
  }
  sendSuccess(res, job);
};

/**
 * 审计页只读上下文的单次聚合：并行拉取最新任务与用户告警绑定，避免 BFF/前端多跳编排。
 * 多表写入场景应在单一 service 内用 Prisma 事务，而不是跨 HTTP 伪事务。
 */
export const getScanContext = async (req: Request, res: Response) => {
  const { address } = req.query;
  if (!address) {
    throw new HttpError(400, 'Address required', 'ADDRESS_REQUIRED');
  }

  if (
    !req.user ||
    address.toString().toLowerCase() !== req.user.sub.toLowerCase()
  ) {
    throw new HttpError(403, 'Forbidden: address mismatch', 'ADDRESS_MISMATCH');
  }

  const addr = address.toString();
  const [latest, telegramChatId] = await Promise.all([
    JobService.getLatestJob(addr),
    UserService.getTelegramChatIdByAddress(req.user.sub),
  ]);

  sendSuccess(res, { latest, telegramChatId });
};

/**
 * 流式审计逻辑（SSE）- 只负责入队和转发日志
 */
export const handleAuditStream = async (req: Request, res: Response) => {
  const { address, jobId } = req.query as { address: string; jobId: string };

  if (!address || !jobId) {
    throw new HttpError(
      400,
      'Missing address or jobId',
      'MISSING_ADDRESS_OR_JOB_ID'
    );
  }

  if (!req.user) {
    throw new HttpError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  if (address.toLowerCase() !== req.user.sub.toLowerCase()) {
    throw new HttpError(403, 'Forbidden: address mismatch', 'ADDRESS_MISMATCH');
  }

  const job = await JobService.getJobById(jobId);
  if (!job) {
    throw new HttpError(404, 'Job not found', 'JOB_NOT_FOUND');
  }
  if (job.user?.address?.toLowerCase() !== address.toLowerCase()) {
    throw new HttpError(403, 'Forbidden: job mismatch', 'JOB_MISMATCH');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const subscriber = pub.duplicate();
  const channel = `job:${jobId}:log`;

  try {
    await subscriber.subscribe(channel);

    subscriber.on('message', (_ch, message) => {
      if (!res.writableEnded) {
        res.write(`data: ${message}\n\n`);
      }
    });

    req.on('close', () => {
      subscriber.unsubscribe(channel);
      subscriber.quit();
      console.log(`[SSE] 客户端断开，jobId=${jobId}`);
    });

    await auditQueue.add({ address, jobId }, { jobId });

    res.write(
      `data: ${JSON.stringify({ agent: 'System', status: 'thinking', content: '任务已提交，等待处理...' })}\n\n`
    );
  } catch (error: unknown) {
    console.error('[handleAuditStream] 捕获异常:', error);
    const errMsg =
      error instanceof Error ? error.message : 'Internal server error';
    try {
      subscriber.unsubscribe(channel);
      subscriber.quit();
    } catch {
      // ignore
    }
    if (!res.headersSent) {
      sendFailure(res, 500, errMsg, 'AUDIT_STREAM_ERROR');
      return;
    }
    try {
      res.write(
        `data: ${JSON.stringify({ agent: 'Watchdog', status: 'error', content: `服务器内部错误: ${errMsg}` })}\n\n`
      );
      res.end();
    } catch {
      // ignore
    }
  }
};

/**
 * 记录用户已撤销的授权项，用于过滤 latest 快照中的旧风险数据。
 */
export const markRevokedAllowance = async (req: Request, res: Response) => {
  const { address, tokenAddress, spenderAddress } = req.body as {
    address?: string;
    tokenAddress?: string;
    spenderAddress?: string;
  };

  if (!address || !tokenAddress || !spenderAddress) {
    throw new HttpError(
      400,
      'Address, tokenAddress and spenderAddress are required',
      'INVALID_REVOKED_ALLOWANCE_INPUT'
    );
  }

  if (!req.user || address.toLowerCase() !== req.user.sub.toLowerCase()) {
    throw new HttpError(403, 'Forbidden: address mismatch', 'ADDRESS_MISMATCH');
  }

  await JobService.markAllowanceRevoked(address, tokenAddress, spenderAddress);
  sendSuccess(res, { ok: true });
};
