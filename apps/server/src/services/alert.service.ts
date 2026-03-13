import axios from 'axios';
import { alertConfig } from '@/config';

export async function sendTelegramAlert(message: string) {
  if (!alertConfig.telegramBotToken || !alertConfig.telegramChatId) return;
  const url = `https://api.telegram.org/bot${alertConfig.telegramBotToken}/sendMessage`;
  await axios.post(url, {
    chat_id: alertConfig.telegramChatId,
    text: `🚨 Sentinel 警报:\n${message}`,
  });
}
