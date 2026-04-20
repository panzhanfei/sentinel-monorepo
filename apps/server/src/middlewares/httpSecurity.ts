import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '@/config';
import { redis } from '@/client/redis.client';

/** 与 main-next BFF 默认子应用端口对齐；含 127.0.0.1 与 localhost，避免本机混用导致跨域失败 */
const LOCAL_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
] as const;

export const parseCorsOrigins = (raw: string): string[] => {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const mergeAllowedOrigins = (): string[] => {
  const fromEnv = parseCorsOrigins(env.CORS_ORIGIN);
  if (env.NODE_ENV === 'production') {
    return fromEnv;
  }
  return [...new Set([...fromEnv, ...LOCAL_DEV_CORS_ORIGINS])];
};

export const buildCorsMiddleware = () => {
  const allowed = mergeAllowedOrigins();
  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });
};

export const buildHelmetMiddleware = () =>
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

export const buildRateLimiter = () => {
  if (!env.RATE_LIMIT_ENABLED) {
    return (_req: unknown, _res: unknown, next: () => void) => {
      next();
    };
  }

  const store = new RedisStore({
    prefix: `${env.REDIS_KEY_PREFIX}:http-rate:`,
    sendCommand: async (...args: (string | Buffer)[]) => {
      const cmd = String(args[0]);
      const rest = args.slice(1);
      return redis.call(cmd, ...rest) as Promise<string | number | null>;
    },
  });

  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skip: (req) => req.method === 'OPTIONS',
    validate: { trustProxy: env.TRUST_PROXY_HOPS > 0 },
  });
};
