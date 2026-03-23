import jwt, { SignOptions } from 'jsonwebtoken';

// ---------- JWT Service ----------

export interface JwtPayload {
  sub: string; // 用户地址
  role?: string;
  [key: string]: unknown;
}

export interface JwtOptions {
  secret: string;
  expiresIn?: SignOptions['expiresIn'];
  algorithm?: SignOptions['algorithm'];
}

export class JwtService {
  constructor(private options: JwtOptions) {}

  sign(payload: JwtPayload): string {
    const { secret, expiresIn = '7d', algorithm = 'HS256' } = this.options;
    return jwt.sign(payload, secret, { expiresIn, algorithm });
  }

  verify(token: string): JwtPayload {
    const { secret, algorithm = 'HS256' } = this.options;
    try {
      const decoded = jwt.verify(token, secret, { algorithms: [algorithm] });
      return decoded as JwtPayload;
    } catch {
      throw new Error('Invalid token');
    }
  }

  decode(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload | null;
  }

  static extractFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  static extractFromCookie(
    cookieString?: string,
    cookieName: string = 'token'
  ): string | null {
    if (!cookieString) return null;
    const match = cookieString.match(new RegExp(`(^| )${cookieName}=([^;]+)`));
    return match ? match[2] : null;
  }
}
