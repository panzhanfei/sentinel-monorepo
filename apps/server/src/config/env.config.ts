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
  PORT: z.preprocess((val) => val ?? '4000', z.string().transform(Number)),

  // // 数据库配置
  // DATABASE_URL: z.string().min(1, 'DATABASE_URL必须提供'),

  // JWT配置
  JWT_SECRET: z
    .string()
    .min(32)
    .default('your-super-secret-jwt-key-change-in-production-2024'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // 刷新令牌独立配置
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32)
    .default('your-refresh-token-secret-different-from-jwt'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // CORS & Rate Limit
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.preprocess(
    (val) => val ?? '900000',
    z.string().transform(Number)
  ),
  RATE_LIMIT_MAX: z.preprocess(
    (val) => val ?? '100',
    z.string().transform(Number)
  ),

  // REDIS 配置
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.preprocess(
    (val) => val ?? '6379',
    z.string().transform(Number)
  ),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.preprocess((val) => val ?? '0', z.string().transform(Number)),
  REDIS_TTL: z.preprocess((val) => val ?? '300', z.string().transform(Number)),

  // 生产环境集群配置
  REDIS_CLUSTER: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  REDIS_SENTINEL: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  REDIS_KEY_PREFIX: z.string().default('myapp:dev'),

  REDIS_MAX_RETRIES: z
    .preprocess(
      (val) => (val === 'null' || val === '' ? null : val),
      z
        .string()
        .nullable()
        .transform((val) => (val === null ? null : Number(val)))
    )
    .default('null'),

  REDIS_CONNECT_TIMEOUT: z.string().default('10000').transform(Number),

  // 修正：默认值也应设为 '0' 以防万一
  REDIS_COMMAND_TIMEOUT: z
    .preprocess(
      (val) => (val === '0' || val === '' ? undefined : val), // 如果是 '0'，预处理为 undefined
      z
        .string()
        .optional()
        .transform((val) => {
          if (!val || val === '0') return undefined; // 再次确保返回 undefined
          return Number(val);
        })
    )
    .default('0'),

  // 缓存配置
  CACHE_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  CACHE_DEFAULT_TTL: z.string().default('300').transform(Number),
  CACHE_PREFIX: z.string().default('cache'),
  REDIS_ENABLE_READY_CHECK: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // === AI Agent 1: DeepSeek (扫描器) ===

  DEEPSEEK_API_KEY: z.string().min(1, 'DeepSeek API Key 缺失'),
  DEEPSEEK_API_URL: z.string().url().default('https://api.deepseek.com/v1'),

  // 本地 Anvil RPC（@sentinel/security-sdk 在 import 时读取 process.env.ANVIL_RPC_URL）
  ANVIL_RPC_URL: z.string().url().default('http://127.0.0.1:8545'),

  // === Agent 4: Telegram 预警配置 (脚本/逻辑) ===
  TELEGRAM_BOT_TOKEN: z.string().optional(), // 机器人 Token；接收方 Chat ID 存于 User.telegramChatId
  /** 不传则使用 alert.config 内默认 Worker 基址；可改为 https://api.telegram.org 做直连对比 */
  TELEGRAM_API_BASE: z.string().url().optional(),
  /** 仅作用于 Telegram 请求；国内/受限机房出口需翻墙时设为可访问的 HTTP 代理，如 http://127.0.0.1:7890 */
  TELEGRAM_HTTPS_PROXY: z.string().url().optional(),
  REDIS_URL: z.string(), // Redis 连接 URL

  // === Agent 5: Watchdog (看门狗配置) ===
  WATCHDOG_INTERVAL_MS: z
    .preprocess((val) => val ?? '30000', z.string().transform(Number))
    .default('30000'),
});

// 4. 解析并验证环境变量
const _env = envSchema.parse(process.env);
// 供 workspace 包在模块加载时读取（未在 .env 中设置时沿用 zod 默认值）
process.env.ANVIL_RPC_URL = process.env.ANVIL_RPC_URL || _env.ANVIL_RPC_URL;
export const env = _env;
