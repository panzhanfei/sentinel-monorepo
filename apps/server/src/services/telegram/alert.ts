import axios from 'axios';
import { alertConfig } from '@/config';

export async function sendTelegramAlert(
  message: string,
  telegramChatId: string | null | undefined
) {
  if (!alertConfig.telegramBotToken || !telegramChatId) return;
  const url = `https://api.telegram.org/bot${alertConfig.telegramBotToken}/sendMessage`;
  console.log('😄', message);
  await axios.post(url, {
    chat_id: telegramChatId,
    text: `🚨 Sentinel 警报:\n${message}`,
  });
}
