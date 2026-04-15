import type { Redis } from 'ioredis';
import { describe, expect, it, vi } from 'vitest';
import { IdempotencyService } from './idempotencyService';

const createMockRedis = () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(
      async (
        key: string,
        value: string,
        _ex: 'EX',
        _ttl: number,
        nx?: 'NX'
      ) => {
        if (nx === 'NX' && store.has(key)) {
          return null;
        }
        store.set(key, value);
        return 'OK';
      }
    ),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  } as unknown as Redis;
}

describe('IdempotencyService', () => {
  it('tryAcquire returns true on first call and false on duplicate', async () => {
    const redis = createMockRedis();
    const svc = new IdempotencyService(redis, { prefix: 'idem', ttl: 60 });
    await expect(svc.tryAcquire('req-1')).resolves.toBe(true);
    await expect(svc.tryAcquire('req-1')).resolves.toBe(false);
  });

  it('release allows acquire again', async () => {
    const redis = createMockRedis();
    const svc = new IdempotencyService(redis);
    await svc.tryAcquire('x');
    await svc.release('x');
    await expect(svc.tryAcquire('x')).resolves.toBe(true);
  });
});
