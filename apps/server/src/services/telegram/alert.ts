import axios from 'axios';
import axiosRetry from 'axios-retry';
import { alertConfig } from '@/config';

const telegramClient = axios.create({
  timeout: 20_000,
});

axiosRetry(telegramClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axios.isAxiosError(error) && !error.response && !!error.request,
});

function logTelegramFailure(err: unknown): void {
  if (axios.isAxiosError(err)) {
    const code = err.code ?? 'unknown';
    const status = err.response?.status;
    console.error(
      `[Telegram] 发送失败 (${code}${status != null ? `, status=${status}` : ''}):`,
      err.message
    );
    return;
  }
  console.error('[Telegram] 发送失败:', err);
}

export async function sendTelegramAlert(
  message: string,
  telegramChatId: string | null | undefined
): Promise<void> {
  if (!alertConfig.telegramBotToken || !telegramChatId) return;
  const url = `https://api.telegram.org/bot${alertConfig.telegramBotToken}/sendMessage`;
  console.log('😄 sendTelegramAlert', message);
  console.log('😄 sendTelegramUrl', url);
  try {
    await telegramClient.post(url, {
      chat_id: telegramChatId,
      text: `🚨 Sentinel 警报:\n${message}`,
    });
  } catch (err) {
    logTelegramFailure(err);
  }
}
