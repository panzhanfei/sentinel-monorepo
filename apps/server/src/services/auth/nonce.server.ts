import crypto from 'node:crypto'; // Node.js 原生加密模块
import { redis } from '@/client/redis.client'; // 使用你封装的单例
import { Logger } from '@/utils';

const logger = new Logger('AuthService');

export class AuthService {
  private readonly NONCE_PREFIX = 'auth:nonce:';
  private readonly EXPIRE_TIME = 120;

  async generateNonce(address: string): Promise<string> {
    const nonce = crypto.randomBytes(16).toString('hex');

    const key = `${this.NONCE_PREFIX}${address.toLowerCase()}`;
    // 写入 Redis 并设置过期时间
    await redis.set(key, nonce, 'EX', this.EXPIRE_TIME);

    logger.info(`Nonce generated for ${address}: ${nonce}`);
    return nonce;
  }
}
