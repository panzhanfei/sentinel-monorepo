// src/types/express.d.ts
import { TokenPayload } from '@/utils/jwt';

// 扩展Express的Request接口
declare global {
  namespace Express {
    interface Request {
      /**
       * 用户信息（来自JWT）
       */
      user?: TokenPayload;

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
      sub: string;
      role?: string;
    }
  }
}

// 空导出使文件成为模块
export {};
