/** 与宿主 apps/main-next `AUTH_SESSION_INVALID_EVENT` 保持一致 */
export const AUTH_SESSION_INVALID_EVENT = "auth-session-invalid";

export type AuthSessionInvalidPayload = { reason?: string };

/** 通知主应用（无界宿主）：审计页 AI 流式问答进行中，用于背景粒子 risk 态 */
export function emitAuditAiStreamToHost(active: boolean) {
  try {
    window.$wujie?.bus?.$emit("audit-ai-stream", { active });
  } catch {
    /* 独立运行或非 wujie 环境 */
  }
}

/** BFF 返回 401 / 会话失效时通知宿主：清 Cookie 并跳转登录 */
export function emitAuthSessionInvalidToHost(
  payload: AuthSessionInvalidPayload = {},
) {
  try {
    window.$wujie?.bus?.$emit(AUTH_SESSION_INVALID_EVENT, payload);
  } catch {
    /* 独立运行：仅子应用内状态由调用方处理 */
  }
}
