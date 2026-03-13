import { env } from '@/config';

export const aiConfig = {
  deepSeekApiKey: env.DEEPSEEK_API_KEY,
  deepSeekApiUrl: env.DEEPSEEK_API_URL,
  geminiApiKey: env.GEMINI_API_KEY,
  geminiApiUrl: env.GEMINI_API_URL,
  groqApiKey: env.GROQ_API_KEY,
  groqApiUrl: env.GROQ_API_URL,
};
