import { streamDeepSeek } from './client';
export const scanWithDeepSeek = async (onChunk: (chunk: string) => void, signal: AbortSignal, data: string) : Promise<string> => {
  console.log('🔍 [Agent 1] 开始流式调用 DeepSeek 初扫...');
  return streamDeepSeek(
    [
      {
        role: 'user',
        content: `请详细分析此数据并识别风险，**最后用不超过50个字总结风险**。数据：${data}`,
      },
    ],
    onChunk,
    '你是一个 Web3 安全扫描器，专注于发现恶意授权、合约漏洞和钓鱼风险。',
    signal
  );
}

export const auditWithDeepSeek = async (onChunk: (chunk: string) => void, signal: AbortSignal, previousReport: string) : Promise<string> => {
  console.log('🔍 [Agent 2] 开始流式调用 DeepSeek 复核...');
  return streamDeepSeek(
    [
      {
        role: 'user',
        content: `复核以下报告，并用**不超过50个字**给出最终结论：\n${previousReport}`,
      },
    ],
    onChunk,
    '你是一名高级区块链审计员。请复核以下初审报告，指出潜在的误报，并细化隐藏的风险逻辑。',
    signal
  );
}

export const generateFinalReport = async (onChunk: (chunk: string) => void, signal: AbortSignal, refinedAudit: string) : Promise<string> => {
  console.log('🔍 [Agent 3] 开始流式调用 DeepSeek 生成最终报告...');
  return streamDeepSeek(
    [{ role: 'user', content: `整理最终报告：\n${refinedAudit}` }],
    onChunk,
    '你是一个安全预警引擎。请根据提供的复核内容整理出一份专业的 Markdown 报告。报告末尾必须严格按照以下格式输出：\n\n[RISK_LEVEL: HIGH/MEDIUM/LOW]',
    signal
  );
}
