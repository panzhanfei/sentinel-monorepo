import { env } from '@/config';

const DEFAULT_TELEGRAM_API_BASE =
  'https://curly-resonance-bfee.13679383435.workers.dev';

export const alertConfig = {
  telegramBotToken: env.TELEGRAM_BOT_TOKEN,
  telegramApiBase: env.TELEGRAM_API_BASE ?? DEFAULT_TELEGRAM_API_BASE,
  /** 仅 Telegram axios 使用，避免全局 HTTPS_PROXY 影响其他服务 */
  telegramHttpsProxy: env.TELEGRAM_HTTPS_PROXY,
  watchdogIntervalMs: env.WATCHDOG_INTERVAL_MS,
};
