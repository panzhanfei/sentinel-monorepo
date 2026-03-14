import axios from 'axios';
import axiosRetry from 'axios-retry';
import { aiConfig } from '@/config';

// 强制禁用代理（即使环境变量中存在 http_proxy）
const axiosInstance = axios.create({
  timeout: 220000,
  proxy: false,
  httpAgent: new (require('http').Agent)({ keepAlive: true }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true }),
});

// 配置重试机制（最多重试3次，仅对网络错误或5xx响应重试）
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

// 请求拦截器：打印请求信息
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

// 响应拦截器：打印响应状态或错误
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

// 确保 API URL 正确（添加 /v1 路径）
const DEEPSEEK_BASE_URL = aiConfig.deepSeekApiUrl.replace(/\/$/, '');
const DEEPSEEK_API_URL = `${DEEPSEEK_BASE_URL}/v1`;

/**
 * 通用流式调用 DeepSeek 函数
 * @param messages 消息列表
 * @param onChunk 收到每个内容块时的回调，参数为增量文本
 * @param systemPrompt 系统提示词（可选）
 * @returns 完整响应文本
 */
async function streamDeepSeek(
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  systemPrompt?: string
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
      stream: true, // 启用流式
    }),
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留最后可能不完整的行

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

  return fullContent;
}

// ---------- 原有一次性函数（保留） ----------

export async function scanWithDeepSeek(data: string): Promise<string> {
  try {
    console.log('🔍 [Agent 1] 开始调用 DeepSeek 初扫...');
    const response = await axiosInstance.post(
      `${DEEPSEEK_API_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个 Web3 安全扫描器，专注于发现恶意授权、合约漏洞和钓鱼风险。',
          },
          { role: 'user', content: `请详细分析此数据并识别风险：${data}` },
        ],
      },
      {
        headers: { Authorization: `Bearer ${aiConfig.deepSeekApiKey}` },
      }
    );
    console.log('✅ [Agent 1] 初扫完成');
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('🔴 [Agent 1] 初扫失败:', error);
    throw new Error('初次扫描失败，请检查 API Key 或网络');
  }
}

export async function auditWithDeepSeek(
  previousReport: string
): Promise<string> {
  try {
    console.log('🔍 [Agent 2] 开始调用 DeepSeek 复核...');
    const response = await axiosInstance.post(
      `${DEEPSEEK_API_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一名高级区块链审计员。请复核以下初审报告，指出潜在的误报，并细化隐藏的风险逻辑。',
          },
          { role: 'user', content: `复核以下报告：\n${previousReport}` },
        ],
      },
      {
        headers: { Authorization: `Bearer ${aiConfig.deepSeekApiKey}` },
      }
    );
    console.log('✅ [Agent 2] 复核完成');
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('🔴 [Agent 2] 复核失败:', error);
    throw new Error('逻辑复核失败');
  }
}

export async function generateFinalReport(
  refinedAudit: string
): Promise<string> {
  try {
    console.log('🔍 [Agent 3] 开始调用 DeepSeek 生成最终报告...');
    const response = await axiosInstance.post(
      `${DEEPSEEK_API_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个安全预警引擎。请根据提供的复核内容整理出一份专业的 Markdown 报告。报告末尾必须严格按照以下格式输出：\n\n[RISK_LEVEL: HIGH/MEDIUM/LOW]',
          },
          { role: 'user', content: `整理最终报告：\n${refinedAudit}` },
        ],
      },
      {
        headers: { Authorization: `Bearer ${aiConfig.deepSeekApiKey}` },
      }
    );
    console.log('✅ [Agent 3] 最终报告生成完成');
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('🔴 [Agent 3] 最终报告生成失败:', error);
    throw new Error('最终报告生成失败');
  }
}

// ---------- 新增流式版本函数 ----------

export async function streamScanWithDeepSeek(
  data: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  console.log('🔍 [Agent 1] 开始流式调用 DeepSeek 初扫...');
  try {
    const full = await streamDeepSeek(
      [
        {
          role: 'user',
          content: `请详细分析此数据并识别风险，**最后用不超过50个字总结风险**。数据：${data}`,
        },
      ],
      onChunk,
      '你是一个 Web3 安全扫描器，专注于发现恶意授权、合约漏洞和钓鱼风险。'
    );
    console.log('✅ [Agent 1] 流式初扫完成');
    return full;
  } catch (error) {
    console.error('🔴 [Agent 1] 流式初扫失败:', error);
    throw new Error('初次扫描失败，请检查 API Key 或网络');
  }
}

export async function streamAuditWithDeepSeek(
  previousReport: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  console.log('🔍 [Agent 2] 开始流式调用 DeepSeek 复核...');
  try {
    const full = await streamDeepSeek(
      [
        {
          role: 'user',
          content: `复核以下报告，并用**不超过50个字**给出最终结论：\n${previousReport}`,
        },
      ],
      onChunk,
      '你是一名高级区块链审计员。请复核以下初审报告，指出潜在的误报，并细化隐藏的风险逻辑。'
    );
    console.log('✅ [Agent 2] 流式复核完成');
    return full;
  } catch (error) {
    console.error('🔴 [Agent 2] 流式复核失败:', error);
    throw new Error('逻辑复核失败');
  }
}
export async function streamGenerateFinalReport(
  refinedAudit: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  console.log('🔍 [Agent 3] 开始流式调用 DeepSeek 生成最终报告...');
  try {
    const full = await streamDeepSeek(
      [{ role: 'user', content: `整理最终报告：\n${refinedAudit}` }],
      onChunk,
      '你是一个安全预警引擎。请根据提供的复核内容整理出一份专业的 Markdown 报告。报告末尾必须严格按照以下格式输出：\n\n[RISK_LEVEL: HIGH/MEDIUM/LOW]'
    );
    console.log('✅ [Agent 3] 流式最终报告生成完成');
    return full;
  } catch (error) {
    console.error('🔴 [Agent 3] 流式最终报告生成失败:', error);
    throw new Error('最终报告生成失败');
  }
}
