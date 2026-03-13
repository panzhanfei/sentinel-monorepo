import { env } from '@/config';

export const alertConfig = {
  telegramBotToken: env.TELEGRAM_BOT_TOKEN,
  telegramChatId: env.TELEGRAM_CHAT_ID,
  watchdogIntervalMs: env.WATCHDOG_INTERVAL_MS,
};
