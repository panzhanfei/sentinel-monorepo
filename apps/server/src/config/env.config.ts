/**
 * 环境配置集中管理模块
 * 作用：验证、类型化访问环境变量，避免分散的process.env调用
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/** 与 schema 默认值一致；生产环境禁止使用这些占位（见 envSchema.superRefine） */
export const DEV_PLACEHOLDER_JWT_SECRET =
  'your-super-secret-jwt-key-change-in-production-2024';
export const DEV_PLACEHOLDER_REFRESH_SECRET =
  'your-refresh-token-secret-different-from-jwt';

// 1. 加载 .env 到 process.env
// 部署形态：① 扁平 server/config/*.js；② dist/server/dist/config/*.js。用「任一常见 env 文件名」定位 server 根，避免只认 NODE_ENV 对应文件名时找不到（线上常只有 .env.production）。
// 若 PM2 未设 NODE_ENV=production，会去找 .env.development；不存在时回退 .env.production，避免仍用 PM2 里占位的 redis://:password@...
// override: true — 覆盖 PM2 注入的旧 REDIS_URL
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
const envNameHints = [envFile, '.env.production', '.env.development', '.env.local', '.env'];

const resolveServerRootForEnv = () : string => {
  const dirCandidates = [path.resolve(__dirname, '..'), path.resolve(__dirname, '../..')];
  for (const root of dirCandidates) {
    for (const name of envNameHints) {
      if (fs.existsSync(path.join(root, name))) {
        return root;
      }
    }
  }
  return dirCandidates[0];
}

const serverRoot = resolveServerRootForEnv();
let envPath = path.join(serverRoot, envFile);
if (!fs.existsSync(envPath)) {
  const prodPath = path.join(serverRoot, '.env.production');
  if (fs.existsSync(prodPath)) {
    envPath = prodPath;
  }
}
dotenv.config({ path: envPath, override: true });

// 2. 定义环境变量模式（类型和验证规则）
const envSchema = z.object({
  // 应用基础配置
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.preprocess((val) => val ?? '4000', z.string().transform(Number)),
  /** Node cluster worker 数量；未设置时由入口使用 os.availableParallelism() */
  CLUSTER_WORKERS: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number().int().positive().optional()
  ),

  // // 数据库配置
  // DATABASE_URL: z.string().min(1, 'DATABASE_URL必须提供'),

  // JWT配置
  JWT_SECRET: z
    .string()
    .min(32)
    .default(DEV_PLACEHOLDER_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // 刷新令牌独立配置
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32)
    .default(DEV_PLACEHOLDER_REFRESH_SECRET),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // CORS & Rate Limit
  /** 逗号分隔多个 Origin；须含协议与主机（无尾斜杠），如 https://app.example.com */
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  /** 生产默认开启；开发/测试默认关闭，避免本地调试触顶或与 Redis 交互异常。显式设 true/false 可覆盖 */
  RATE_LIMIT_ENABLED: z
    .preprocess((val) => {
      if (val === '' || val === undefined) {
        const nodeEnv = process.env.NODE_ENV || 'development';
        return nodeEnv === 'production' ? 'true' : 'false';
      }
      return val;
    }, z.string())
    .transform((v) => v !== 'false'),
  RATE_LIMIT_WINDOW_MS: z.preprocess(
    (val) => val ?? '900000',
    z.string().transform(Number)
  ),
  RATE_LIMIT_MAX: z.preprocess(
    (val) => val ?? '100',
    z.string().transform(Number)
  ),

  /** 反代层数（如仅 Caddy 一层则设为 1），用于限流取真实 IP 与 Express trust proxy */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),

  /** express.json 单请求体上限，如 512kb、1mb、2mb */
  JSON_BODY_LIMIT: z.string().default('1mb'),

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
}).superRefine((data, ctx) => {
  if (data.NODE_ENV !== 'production') return;

  if (data.JWT_SECRET === DEV_PLACEHOLDER_JWT_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        '生产环境禁止使用 JWT_SECRET 占位默认值，请在环境变量中设置强随机密钥（≥32 字符）',
      path: ['JWT_SECRET'],
    });
  }
  if (data.REFRESH_TOKEN_SECRET === DEV_PLACEHOLDER_REFRESH_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        '生产环境禁止使用 REFRESH_TOKEN_SECRET 占位默认值，请设置与 JWT_SECRET 不同的强随机密钥',
      path: ['REFRESH_TOKEN_SECRET'],
    });
  }
  if (data.JWT_SECRET === data.REFRESH_TOKEN_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'JWT_SECRET 与 REFRESH_TOKEN_SECRET 不得相同',
      path: ['REFRESH_TOKEN_SECRET'],
    });
  }
});

// 4. 解析并验证环境变量
const _env = envSchema.parse(process.env);
// 供 workspace 包在模块加载时读取（未在 .env 中设置时沿用 zod 默认值）
process.env.ANVIL_RPC_URL = process.env.ANVIL_RPC_URL || _env.ANVIL_RPC_URL;
export const env = _env;
