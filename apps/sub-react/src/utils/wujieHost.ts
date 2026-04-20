import {
  AUDIT_REACT_HOST_PAGE_MODAL_OPEN_EVENT,
  type IWujieHostPageModalOpenPayload,
} from "@/constants/wujieAuditBus";

export type { IWujieHostPageModalOpenPayload };

/** 与宿主 apps/main-next `AUTH_SESSION_INVALID_EVENT` 保持一致 */
export const AUTH_SESSION_INVALID_EVENT = "auth-session-invalid";

export type AuthSessionInvalidPayload = { reason?: string };

export const emitAuditAiStreamToHost = (active: boolean) => {
  try {
    window.$wujie?.bus?.$emit("audit-ai-stream", { active });
  } catch {
    /* 独立运行或非 wujie 环境 */
  }
}

export const emitAuthSessionInvalidToHost = (payload: AuthSessionInvalidPayload = {}) => {
  try {
    window.$wujie?.bus?.$emit(AUTH_SESSION_INVALID_EVENT, payload);
  } catch {
    /* 独立运行：仅子应用内状态由调用方处理 */
  }
};

export const emitAuditHostPageModalToHost = (
  payload: IWujieHostPageModalOpenPayload = {},
) => {
  try {
    window.$wujie?.bus?.$emit(AUDIT_REACT_HOST_PAGE_MODAL_OPEN_EVENT, payload);
  } catch {
    /* 独立运行 */
  }
};
