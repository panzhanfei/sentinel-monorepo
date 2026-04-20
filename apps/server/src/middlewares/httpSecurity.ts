import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '@/config';
import { redis } from '@/client/redis.client';

export const parseCorsOrigins = (raw: string): string[] => {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const buildCorsMiddleware = () => {
  const allowed = parseCorsOrigins(env.CORS_ORIGIN);
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
