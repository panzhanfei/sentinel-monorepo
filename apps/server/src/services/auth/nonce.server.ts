import crypto from 'node:crypto'; // Node.js 原生加密模块
import { redisClient } from '@/client/redis.client'; // 使用你封装的单例
import { Logger } from '@/utils';

const logger = new Logger('AuthService');

export class AuthService {
  private readonly NONCE_PREFIX = 'auth:nonce:';
  private readonly EXPIRE_TIME = 120; // 5分钟有效期

  async generateNonce(address: string): Promise<string> {
    // 生成 16 字节高熵随机数并转为十六进制字符串
    const nonce = crypto.randomBytes(16).toString('hex');

    // Key 规范：auth:nonce:0x... (转换为小写防止大小写不一致导致的 Key 命中失败)
    const key = `${this.NONCE_PREFIX}${address.toLowerCase()}`;

    // 写入 Redis 并设置过期时间
    await redisClient.set(key, nonce, 'EX', this.EXPIRE_TIME);

    logger.info(`Nonce generated for ${address}: ${nonce}`);
    return nonce;
  }
}
