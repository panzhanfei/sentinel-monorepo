/** 通知主应用（无界宿主）：审计页 AI 流式问答进行中，用于背景粒子 risk 态 */
export function emitAuditAiStreamToHost(active: boolean) {
  try {
    window.$wujie?.bus?.$emit("audit-ai-stream", { active });
  } catch {
    /* 独立运行或非 wujie 环境 */
  }
}
