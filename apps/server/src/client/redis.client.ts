import Redis from 'ioredis';
import { RedisConfig, getRedisConfig } from '@/config';
import { Logger } from '@/utils';
const logger = new Logger('Redis');

export class RedisClient extends Redis {
  private static instance: RedisClient;
  constructor(config?: Partial<RedisConfig>) {
    const finalConfig = { ...getRedisConfig(), ...config };
    super(finalConfig);
    this.setupEventListeners();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<RedisConfig>): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config);
    }
    return RedisClient.instance;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 连接成功
    this.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    // 连接错误
    this.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    // 正在重连
    this.on('reconnecting', (delay) => {
      logger.warn(`Redis reconnecting in ${delay}ms`);
    });

    // 连接关闭
    this.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // 准备就绪
    this.on('ready', () => {
      logger.info('Redis client ready');
    });

    // 结束
    this.on('end', () => {
      logger.info('Redis connection ended');
    });
  }
}

// 导出创建实例的便捷函数
export const createRedisClient = (
  config?: Partial<RedisConfig>
): RedisClient => {
  return RedisClient.getInstance(config);
};

// 导出默认实例
export const redisClient = createRedisClient();
