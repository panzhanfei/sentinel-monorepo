import type { Redis } from 'ioredis';
import { verifyMessage } from 'viem';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NonceService } from './nonceService';

vi.mock('viem', () => ({
  verifyMessage: vi.fn(),
}));

const mockedVerifyMessage = vi.mocked(verifyMessage);

const createMockRedis = () => {
  const store = new Map<string, string>();
  return {
    set: vi.fn(
      async (key: string, value: string, _ex: 'EX', _ttl: number) => {
        store.set(key, value);
        return 'OK';
      }
    ),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  } as unknown as Redis;
}

describe('NonceService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('generate stores nonce under expected key', async () => {
    const redis = createMockRedis();
    const svc = new NonceService(redis, { prefix: 'n', ttl: 120 });
    const nonce = await svc.generate('0xAbC', 'login');
    expect(nonce).toContain('login');
    expect(redis.set).toHaveBeenCalledWith(
      'n:login:0xabc',
      nonce,
      'EX',
      120
    );
  });

  it('verify returns false when nonce missing or message mismatch', async () => {
    const redis = createMockRedis();
    const svc = new NonceService(redis);
    await expect(
      svc.verify('0x1', 'op', '0xsig', 'wrong-message')
    ).resolves.toBe(false);
    expect(mockedVerifyMessage).not.toHaveBeenCalled();
  });

  it('verify deletes nonce on valid signature', async () => {
    mockedVerifyMessage.mockResolvedValueOnce(true);
    const redis = createMockRedis();
    const svc = new NonceService(redis);
    const msg = await svc.generate('0xuser', 'login');
    await expect(
      svc.verify('0xuser', 'login', '0xsig', msg)
    ).resolves.toBe(true);
    expect(redis.del).toHaveBeenCalled();
    expect(mockedVerifyMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xuser',
        message: msg,
        signature: '0xsig',
      })
    );
  });

  it('invalidate removes key', async () => {
    const redis = createMockRedis();
    const svc = new NonceService(redis);
    await svc.generate('0xa', 'x');
    await svc.invalidate('0xa', 'x');
    expect(redis.del).toHaveBeenCalled();
  });
});
