import { describe, expect, it } from 'vitest';
import { JwtService } from './jwtService';

describe('JwtService', () => {
  const secret = 'test-secret-at-least-32-chars-long!!';
  const service = new JwtService({ secret, expiresIn: '1h' });

  it('signs and verifies a payload', () => {
    const token = service.sign({ sub: '0xabc', role: 'user' });
    const decoded = service.verify(token);
    expect(decoded.sub).toBe('0xabc');
    expect(decoded.role).toBe('user');
  });

  it('throws on invalid token', () => {
    expect(() => service.verify('not-a-jwt')).toThrow('Invalid token');
  });

  it('decode returns payload without verification', () => {
    const token = service.sign({ sub: '0xdec' });
    const decoded = service.decode(token);
    expect(decoded?.sub).toBe('0xdec');
  });

  it('extractFromHeader parses Bearer token', () => {
    expect(JwtService.extractFromHeader('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(JwtService.extractFromHeader('Basic x')).toBeNull();
    expect(JwtService.extractFromHeader(undefined)).toBeNull();
  });

  it('extractFromCookie reads named cookie', () => {
    expect(
      JwtService.extractFromCookie('a=1; token=myjwt; b=2', 'token')
    ).toBe('myjwt');
    expect(JwtService.extractFromCookie(undefined)).toBeNull();
  });
});
