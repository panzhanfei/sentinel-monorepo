import { RedisClient } from "@sentinel/database";

// Next.js 15 推荐的环境变量获取方式
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  keyPrefix: "sentinel-monorepo:",
};

// 获取单例（内部会自动处理 globalForRedis，防止热更新连接爆满）
export const redis = RedisClient.getInstance(redisConfig);

// 初始化脚本
redis.initScripts();
