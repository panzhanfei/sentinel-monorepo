import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from './jwtService';

/** expiresIn 使用与 jsonwebtoken 一致的联合类型（如 `"15m"`、`"7d"`） */
export interface DualJwtOptions {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: SignOptions['expiresIn'];
  refreshExpiresIn: SignOptions['expiresIn'];
}

/**
 * Access Token（短效）+ Refresh Token（长效、独立密钥、带 isRefresh）双令牌签发与校验。
 */
export class DualJwtService {
  constructor(private readonly opts: DualJwtOptions) {}

  signAccess(payload: JwtPayload): string {
    return jwt.sign(payload, this.opts.accessSecret, {
      expiresIn: this.opts.accessExpiresIn,
      algorithm: 'HS256',
    });
  }

  signRefresh(payload: JwtPayload): string {
    return jwt.sign(
      { ...payload, isRefresh: true },
      this.opts.refreshSecret,
      {
        expiresIn: this.opts.refreshExpiresIn,
        algorithm: 'HS256',
      }
    );
  }

  verifyAccess(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.opts.accessSecret, {
      algorithms: ['HS256'],
    });
    return decoded as JwtPayload;
  }

  verifyRefresh(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.opts.refreshSecret, {
      algorithms: ['HS256'],
    }) as JwtPayload & { isRefresh?: boolean };

    if (!decoded.isRefresh) {
      throw new Error('Invalid refresh token');
    }

    const { isRefresh: _r, ...rest } = decoded;
    return rest as JwtPayload;
  }

  generatePair(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.signAccess(payload),
      refreshToken: this.signRefresh(payload),
    };
  }

  static extractBearer(authHeader?: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7).trim() || null;
  }
}
