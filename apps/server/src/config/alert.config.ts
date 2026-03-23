import { env } from '@/config';

export const alertConfig = {
  telegramBotToken: env.TELEGRAM_BOT_TOKEN,
  watchdogIntervalMs: env.WATCHDOG_INTERVAL_MS,
};
