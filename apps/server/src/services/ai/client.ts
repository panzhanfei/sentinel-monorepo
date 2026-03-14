import axios from 'axios';
import axiosRetry from 'axios-retry';
import { aiConfig } from '@/config';

// 强制禁用代理
const axiosInstance = axios.create({
  timeout: 220000,
  proxy: false,
  httpAgent: new (require('http').Agent)({ keepAlive: true }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true }),
});

// 配置重试机制
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`🔄 重试第 ${retryCount} 次，原因: ${error.message}`);
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use((config) => {
  console.log(`🌐 [AI Request] ${config.method?.toUpperCase()} ${config.url}`);
  if (config.data) {
    const dataStr = JSON.stringify(config.data);
    console.log(
      `📦 [AI Request Body] ${dataStr.substring(0, 200)}${dataStr.length > 200 ? '...' : ''}`
    );
  }
  return config;
});

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [AI Response] ${response.status} from ${response.config.url}`
    );
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error(`❌ [AI Error]`, {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        method: error.config?.method,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });
    } else {
      console.error('❌ [AI Unknown Error]', error);
    }
    return Promise.reject(error);
  }
);

// 确保 API URL 正确
const DEEPSEEK_BASE_URL = aiConfig.deepSeekApiUrl.replace(/\/$/, '');
export const DEEPSEEK_API_URL = `${DEEPSEEK_BASE_URL}/v1`;

/**
 * 通用流式调用 DeepSeek 函数（支持取消）
 * @param messages 消息列表
 * @param onChunk 收到每个内容块时的回调
 * @param systemPrompt 系统提示词
 * @param signal 可选的 AbortSignal 用于取消请求
 * @returns 完整响应文本
 */
export async function streamDeepSeek(
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  systemPrompt?: string,
  signal?: AbortSignal
): Promise<string> {
  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.deepSeekApiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: allMessages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              onChunk(delta);
            }
          } catch (e) {
            console.warn('Failed to parse SSE line:', line, e);
          }
        }
      }
    }
  } catch (error) {
    // 如果是用户通过 AbortSignal 取消，则抛出 AbortError
    if (signal?.aborted) {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }
    throw error;
  }

  return fullContent;
}

// 导出 axiosInstance 以便一次性请求使用
export { axiosInstance };
