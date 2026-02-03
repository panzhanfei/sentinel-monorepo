import { type RedisOptions } from 'ioredis';
import { env } from '@/config';

export interface RedisConfig extends RedisOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  // 重启策略
  retryStrategy?: (times: number) => number | null | void;
}

export const getRedisConfig = (): RedisConfig => {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    keyPrefix: 'sentinel-monorepo:',
    maxRetriesPerRequest: env.REDIS_MAX_RETRIES,
    connectTimeout: env.REDIS_CONNECT_TIMEOUT,
    commandTimeout: env.REDIS_COMMAND_TIMEOUT,
  };
};
