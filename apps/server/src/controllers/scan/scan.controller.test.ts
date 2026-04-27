import '../../vitestEnv';
import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('@/services/queue', () => ({
  auditQueue: { add: vi.fn() },
  pub: { duplicate: vi.fn(() => ({ subscribe: vi.fn(), on: vi.fn(), quit: vi.fn(), unsubscribe: vi.fn() })) },
  sub: { duplicate: vi.fn() },
}));

const sendSuccess = vi.hoisted(() => vi.fn());
vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>();
  return {
    ...actual,
    sendSuccess: (...args: unknown[]) => (sendSuccess as MockedFunction)(...args),
    sendFailure: vi.fn(),
    HttpError: class extends Error {
      status: number;
      code?: string;
      constructor(s: number, m: string, c?: string) {
        super(m);
        this.status = s;
        this.name = 'HttpError';
        this.code = c;
      }
    },
  };
});

import { getScanContext } from './scan.controller';
import { JobService, UserService } from '@/services';

describe('getScanContext', () => {
  const mockJob = { id: 'j1', status: 'COMPLETED' };

  beforeEach(() => {
    sendSuccess.mockClear();
    vi.restoreAllMocks();
  });

  it('rejects when address is missing', async () => {
    const req = { query: {} } as unknown as Request;
    const res = {} as unknown as Response;
    await expect(getScanContext(req, res)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects on address mismatch with auth user', async () => {
    const req = {
      query: { address: '0xaaa' },
      user: { sub: '0xbbb' },
    } as unknown as Request;
    const res = {} as unknown as Response;
    await expect(getScanContext(req, res)).rejects.toMatchObject({ status: 403 });
  });

  it('returns latest and telegram in one payload', async () => {
    vi.spyOn(JobService, 'getLatestJob').mockResolvedValue(
      mockJob as Awaited<ReturnType<typeof JobService.getLatestJob>>
    );
    vi.spyOn(UserService, 'getTelegramChatIdByAddress').mockResolvedValue('tg-1');

    const req = {
      query: { address: '0xAbC' },
      user: { sub: '0xabc' },
    } as unknown as Request;
    const res = {} as unknown as Response;

    await getScanContext(req, res);

    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      { latest: mockJob, telegramChatId: 'tg-1' }
    );
  });

  it('returns null latest when there is no job', async () => {
    vi.spyOn(JobService, 'getLatestJob').mockResolvedValue(null);
    vi.spyOn(UserService, 'getTelegramChatIdByAddress').mockResolvedValue(null);

    const req = {
      query: { address: '0xabc' },
      user: { sub: '0xabc' },
    } as unknown as Request;
    const res = {} as unknown as Response;

    await getScanContext(req, res);

    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      { latest: null, telegramChatId: null }
    );
  });
});
