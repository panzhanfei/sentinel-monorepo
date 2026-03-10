import { AllowanceResult } from "@sentinel/security-sdk";

export async function generateAIVerdict(
  address: string,
  allowances: AllowanceResult[],
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL;

  // 1. 整理风险上下文
  const activeRisks = allowances.filter(
    (a) => BigInt(a.rawAllowance) > BigInt(0),
  );
  const riskContext = activeRisks
    .map(
      (a) => `${a.tokenSymbol} 授权给 ${a.spenderName} (额度: ${a.allowance})`,
    )
    .join("; ");

  // 2. 构造 Prompt
  const prompt = `你是一个 Web3 安全 AI 审计官。
用户地址: ${address}
资产风险: ${riskContext || "暂无活动风险，表现完美"}

任务：
1. 分析潜在风险。如果有高额授权，请用警告语气；如果没有，请夸奖用户。
2. 语言风格：冷酷、精准、专业。
3. 严格限制在 50 字以内。`;

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个嵌入在 Sentinel 协议中的安全 AI。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
      }),
    });

    const data = await response.json();
    console.log("🚀 AI Response:", data.choices[0].message);
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI 服务异常:", error);
    return "AI 诊断引擎暂时离线。底层数据建议：请检查活动授权列表并撤销不需要的额度。";
  }
}
