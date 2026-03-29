import axios from 'axios';
import axiosRetry from 'axios-retry';
import { alertConfig } from '@/config';

// Cloudflare Worker 代理地址（请替换为你实际部署的地址）
const TELEGRAM_PROXY_BASE =
  'https://curly-resonance-bfee.13679383435.workers.dev';

const telegramClient = axios.create({
  timeout: 20_000,
});

axiosRetry(telegramClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axios.isAxiosError(error) && !error.response && !!error.request,
});

export async function sendTelegramAlert(
  message: string,
  telegramChatId: string | null | undefined
): Promise<void> {
  if (!alertConfig.telegramBotToken || !telegramChatId) return;

  const url = `${TELEGRAM_PROXY_BASE}/bot${alertConfig.telegramBotToken}/sendMessage`;

  try {
    await telegramClient.post(url, {
      chat_id: telegramChatId,
      text: `🚨 Sentinel 警报:\n${message}`,
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(
        `[Telegram] 发送失败 (${err.code ?? 'unknown'}${
          err.response?.status ? `, status=${err.response.status}` : ''
        }):`,
        err.message
      );
    } else {
      console.error('[Telegram] 发送失败:', err);
    }
  }
}
