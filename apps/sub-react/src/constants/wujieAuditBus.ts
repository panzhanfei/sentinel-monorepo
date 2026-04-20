/**
 * 与 apps/main-next/src/wujie/wujieAuditBus.ts 保持一致（事件名勿单方修改）
 */
export const REACT_SUB_NAVIGATE_EVENT = "react-sub-navigate";
export const AUDIT_REACT_HOST_SYNC_EVENT = "audit-react-sync-host";

export const AUDIT_REACT_HOST_PAGE_MODAL_OPEN_EVENT =
  "audit-react-host-page-modal-open";
export const AUDIT_REACT_HOST_PAGE_MODAL_CLOSED_EVENT =
  "audit-react-host-page-modal-closed";

export interface IWujieHostPageModalOpenPayload {
  title?: string;
}
