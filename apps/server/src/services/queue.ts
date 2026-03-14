import Bull from 'bull';
import { redis } from '@/client';
import { env } from '@/config';

const REDIS_URL = env.REDIS_URL;

export const auditQueue = new Bull('audit', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
  settings: {
    lockDuration: 300000, // 5分钟（毫秒）
    stalledInterval: 30000, // 每30秒检查一次stalled
    maxStalledCount: 2, // 最多允许stalled 2次
  },
});

export const pub = redis.duplicate();
export const sub = redis.duplicate();
