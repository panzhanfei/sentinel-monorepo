import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { DualJwtService } from './dualJwtService';

describe('DualJwtService', () => {
  const accessSecret = 'access-secret-min-32-chars-long!!!!';
  const refreshSecret = 'refresh-secret-min-32-chars-long!!!';
  const service = new DualJwtService({
    accessSecret,
    refreshSecret,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  });

  it('issues access and refresh pair', () => {
    const { accessToken, refreshToken } = service.generatePair({
      sub: '0xpair',
    });
    const access = service.verifyAccess(accessToken);
    expect(access.sub).toBe('0xpair');
    const refresh = service.verifyRefresh(refreshToken);
    expect(refresh.sub).toBe('0xpair');
    expect((refresh as { isRefresh?: boolean }).isRefresh).toBeUndefined();
  });

  it('rejects access token verified as refresh', () => {
    const { accessToken } = service.generatePair({ sub: '0xbad' });
    expect(() => service.verifyRefresh(accessToken)).toThrow();
  });

  it('rejects refresh token without isRefresh flag', () => {
    const forged = jwt.sign(
      { sub: '0xforge' },
      refreshSecret,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    expect(() => service.verifyRefresh(forged)).toThrow('Invalid refresh token');
  });

  it('extractBearer trims token', () => {
    expect(DualJwtService.extractBearer('Bearer  tok  ')).toBe('tok');
    expect(DualJwtService.extractBearer('Token x')).toBeNull();
  });
});
