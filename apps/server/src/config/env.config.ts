/**
 * 环境配置集中管理模块
 * 作用：验证、类型化访问环境变量，避免分散的process.env调用
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// 1. 加载.env文件到process.env
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 2. 定义环境变量模式（类型和验证规则）
const envSchema = z.object({
  // 应用基础配置
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000').transform(Number), // 转换为数字

  // 数据库配置
  DATABASE_URL: z.string().min(1, 'DATABASE_URL必须提供'),

  // JWT配置
  JWT_SECRET: z
    .string()
    .min(32, 'JWT密钥至少需要32个字符')
    .default('dev-secret-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // 刷新令牌独立配置（安全最佳实践）
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32)
    .default('dev-refresh-secret-different-from-jwt'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // CORS配置
  CORS_ORIGIN: z.string().default('http://localhost:3000'), // 修正字段名
  CLIENT_URL: z.string().url().default('http://localhost:8000'),

  // 速率限制配置
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 转换为数字
  RATE_LIMIT_MAX: z.string().default('100').transform(Number), // 修正字段名，转换为数字

  // REDIS 配置
  REDIS_HOST: z.string().default('localhost'), // 改为 string
  REDIS_PORT: z.string().default('6379').transform(Number), // 转换为数字
  REDIS_PASSWORD: z.string().optional().default(''), // 可选，默认为空
  REDIS_DB: z.string().default('0').transform(Number), // 转换为数字
  REDIS_TTL: z.string().default('3600').transform(Number), // 转换为数字

  // 生产环境配置（添加默认值）
  REDIS_CLUSTER: z
    .string()
    .default('false')
    .transform((val) => val.toLowerCase() === 'true'), // 转换为布尔值
  REDIS_SENTINEL: z
    .string()
    .default('false')
    .transform((val) => val.toLowerCase() === 'true'), // 转换为布尔值

  REDIS_KEY_PREFIX: z.string().default('myapp:dev'),

  // 连接池配置
  // REDIS_MAX_RETRIES: z.string().default('3').transform(Number), // 转换为数字
  REDIS_MAX_RETRIES: z.preprocess(
    (val) => {
      // 如果环境变量是空字符串或字符串 "null"，返回 null
      if (val === '' || val === 'null') return null;
      return val;
    },
    z
      .string()
      .nullable()
      .default('3')
      .transform((val) => {
        // 如果 val 为 null，返回 null；否则转换为数字
        return val === null ? null : Number(val);
      })
  ),

  REDIS_CONNECT_TIMEOUT: z.string().default('10000').transform(Number), // 转换为数字
  REDIS_COMMAND_TIMEOUT: z.string().default('5000').transform(Number), // 转换为数字

  // 缓存配置
  CACHE_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val.toLowerCase() === 'true'), // 转换为布尔值
  CACHE_DEFAULT_TTL: z.string().default('300').transform(Number), // 转换为数字
  CACHE_PREFIX: z.string().default('cache'),
  REDIS_ENABLE_READY_CHECK: z
    .string()
    .default('true')
    .transform((val) => val.toLowerCase() === 'true'), // 转换为布尔值
});

// 3. 创建配置对象，先合并默认值，再解析
const processEnv = {
  ...process.env,
  // 提供所有 schema 中定义的字段的默认值
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
};

// 4. 解析并验证环境变量
export const env = envSchema.parse(processEnv);
