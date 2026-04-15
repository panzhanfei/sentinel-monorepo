/**
 * 聊天入口前置校验：无扫描数据或明显闲聊时不调用多 Agent，节省 token。
 */

const OFF_TOPIC_PREFIX =
  /^(你好|您好|嗨|hi|hello|hey|在吗|在么|谢谢|多谢|哈哈哈|哈哈|呵呵|陪我聊天|讲个笑话|讲个故事|天气|吃饭了吗|早上好|晚上好|晚安)/i;

/** 明显与安全扫描无关的求助（仍不做 LLM 调用） */
const OFF_TOPIC_CREATIVE =
  /(写一首|七律|宋词|leetcode|用python|用 js |javascript|帮我写作业|红楼梦|翻译全文|马云是谁|特朗普)/i;

const hasEthAddress = (text: string) : boolean => {
  return /0x[a-fA-F0-9]{40}\b/.test(text);
}

export const isClearlyOffTopicQuestion = (message: string) : boolean => {
  const t = message.trim();
  if (!t) return true;
  if (hasEthAddress(t)) return false;
  if (t.length < 6 && !/\d/.test(t)) return true;
  if (OFF_TOPIC_PREFIX.test(t) && t.length < 48) return true;
  if (OFF_TOPIC_CREATIVE.test(t)) return true;
  return false;
}

export const getAllowancesFromJobResult = (result: unknown) : unknown[] | null => {
  if (!result || typeof result !== 'object') return null;
  const r = result as { allowances?: unknown };
  return Array.isArray(r.allowances) ? r.allowances : null;
}

export const hasCompletedScanWithData = (job: { status: string; result: unknown } | null) : boolean => {
  if (!job || job.status !== 'COMPLETED') return false;
  const allowances = getAllowancesFromJobResult(job.result);
  return Array.isArray(allowances) && allowances.length > 0;
}
