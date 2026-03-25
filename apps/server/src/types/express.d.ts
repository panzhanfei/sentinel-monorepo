// src/types/express.d.ts
import type { JwtPayload } from '@sentinel/auth';

declare global {
  namespace Express {
    interface Request {
      /**
       * 用户信息（来自 Access Token JWT）
       */
      user?: JwtPayload;

      /**
       * 请求唯一标识符（用于日志追踪）
       */
      requestId?: string;

      /**
       * 原始请求体（用于签名验证等）
       */
      rawBody?: Buffer;

      /**
       * 客户端IP地址
       */
      clientIp?: string;
    }
  }
}

export {};
