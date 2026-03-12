import { Redis } from 'ioredis';
import { verifyMessage } from 'viem';
import { randomUUID } from 'crypto';

// ---------- Nonce Service (需要签名的防重放) ----------
export interface NonceOptions {
  prefix?: string;
  ttl?: number; // 秒
}

export class NonceService {
  constructor(
    private redis: Redis,
    private options: NonceOptions = {}
  ) {}

  private getKey(address: string, operation: string): string {
    const prefix = this.options.prefix || 'nonce';
    return `${prefix}:${operation}:${address.toLowerCase()}`;
  }

  /**
   * 生成一次性 Nonce 并存入 Redis
   */
  async generate(address: string, operation: string): Promise<string> {
    const key = this.getKey(address, operation);
    const nonce = `Sentinel ${operation} request: ${randomUUID()}`;
    const ttl = this.options.ttl || 300; // 默认5分钟
    await this.redis.set(key, nonce, 'EX', ttl);
    return nonce;
  }

  /**
   * 验证签名并删除 Nonce
   */
  async verify(
    address: string,
    operation: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    const key = this.getKey(address, operation);
    const savedNonce = await this.redis.get(key);
    if (!savedNonce || savedNonce !== message) {
      return false;
    }

    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message: savedNonce,
      signature: signature as `0x${string}`,
    });

    if (isValid) {
      await this.redis.del(key);
    }
    return isValid;
  }

  /**
   * 主动作废 Nonce
   */
  async invalidate(address: string, operation: string): Promise<void> {
    const key = this.getKey(address, operation);
    await this.redis.del(key);
  }
}
