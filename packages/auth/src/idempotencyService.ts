import { Redis } from 'ioredis';

// ---------- Idempotency Service (轻量幂等，无需签名) ----------
export interface IdempotencyOptions {
  prefix?: string;
  ttl?: number; // 秒，默认24小时
}

export class IdempotencyService {
  constructor(
    private redis: Redis,
    private options: IdempotencyOptions = {}
  ) {}

  private getKey(id: string): string {
    const prefix = this.options.prefix || 'idempotency';
    return `${prefix}:${id}`;
  }

  /**
   * 尝试获取幂等锁，返回 true 表示首次处理，false 表示重复请求
   */
  async tryAcquire(id: string): Promise<boolean> {
    const key = this.getKey(id);
    const ttl = this.options.ttl || 60 * 60 * 24; // 默认24小时
    const result = await this.redis.set(key, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  }

  /**
   * 主动释放幂等锁（例如处理失败后允许重试）
   */
  async release(id: string): Promise<void> {
    const key = this.getKey(id);
    await this.redis.del(key);
  }
}
