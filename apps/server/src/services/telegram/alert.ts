import http from 'http';
import https from 'https';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { alertConfig } from '@/config';

// 与 AI 客户端一致：不用全局 HTTPS_PROXY；机房出不了网时在 TELEGRAM_HTTPS_PROXY 里单独配代理
const httpsAgent =
  alertConfig.telegramHttpsProxy != null
    ? new HttpsProxyAgent(alertConfig.telegramHttpsProxy)
    : new https.Agent({ keepAlive: true });

const telegramClient = axios.create({
  timeout: 30_000,
  proxy: false,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent,
});

axiosRetry(telegramClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axios.isAxiosError(error) &&
    (axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (!error.response && !!error.request)),
});

export async function sendTelegramAlert(
  message: string,
  telegramChatId: string | null | undefined
): Promise<void> {
  if (!alertConfig.telegramBotToken || !telegramChatId) return;

  const url = `${alertConfig.telegramApiBase}/bot${alertConfig.telegramBotToken}/sendMessage`;

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
        }, base=${new URL(alertConfig.telegramApiBase).hostname}):`,
        err.message
      );
    } else {
      console.error('[Telegram] 发送失败:', err);
    }
  }
}
