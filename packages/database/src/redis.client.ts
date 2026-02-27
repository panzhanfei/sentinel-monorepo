// packages/database/src/redis.client.ts
import Redis, { RedisOptions } from 'ioredis';

// 1. 定义配置接口（直接用 ioredis 的 RedisOptions）
export interface RedisConfig extends RedisOptions {
  keyPrefix?: string;
}

interface CustomRedisCommands {
  /**
   * 滑动窗口限流
   * @param key 限流键
   * @param now 当前时间戳
   * @param window 窗口大小(ms)
   * @param limit 限制次数
   * @returns 1: 允许, 0: 拦截
   */
  slidingWindowLimit(
    key: string,
    now: number,
    window: number,
    limit: number
  ): Promise<number>;
}

// 2. 利用 TypeScript 的声明合并 (Declaration Merging)
// 告诉 TS：Redis 这个类现在拥有了 CustomRedisCommands 里的方法
export interface RedisClient extends CustomRedisCommands {}

// 2. 解决 Next.js 开发环境下单例失效的全局变量
const globalForRedis = global as unknown as { redisInstance: RedisClient };

export class RedisClient extends Redis {
  private static instance: RedisClient;

  // 3. 修改单例获取逻辑
  static getInstance(config: RedisConfig): RedisClient {
    // 如果是开发环境，优先从全局变量获取，防止重复连接
    if (process.env.NODE_ENV !== 'production') {
      if (!globalForRedis.redisInstance) {
        globalForRedis.redisInstance = new RedisClient(config);
      }
      return globalForRedis.redisInstance;
    }

    // 生产环境使用标准单例
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config);
    }
    return RedisClient.instance;
  }

  constructor(config: RedisConfig) {
    super(config);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.on('connect', () => console.log('🚀 [Redis] Connected'));
    this.on('error', (err) => console.error('❌ [Redis] Error:', err));
  }

  //注册 Lua 脚本限流命令
  public initScripts() {
    this.defineCommand('slidingWindowLimit', {
      numberOfKeys: 1,
      lua: `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])

        -- 1. 清理窗口之外的旧数据
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

        -- 2. 统计当前窗口内的请求数
        local current = redis.call('ZCARD', key)

        -- 3. 判断是否超限
        if current < limit then
          -- 没超限，记录本次请求
          redis.call('ZADD', key, now, now)
          -- 设置过期时间（略大于窗口期），防止冷数据堆积
          redis.call('EXPIRE', key, math.ceil(window / 1000) + 1)
          return 1 -- 允许通过
        else
          return 0 -- 拒绝请求
        end
      `,
    });
  }
}
