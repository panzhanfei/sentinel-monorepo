/**
 * 与 apps/sub-react/src/constants/wujieAuditBus.ts 保持一致（事件名勿单方修改）
 */
export const REACT_SUB_NAVIGATE_EVENT = "react-sub-navigate";
export const AUDIT_REACT_HOST_SYNC_EVENT = "audit-react-sync-host";

/** sub-react → 宿主：页面级弹窗（宿主 document） */
export const AUDIT_REACT_HOST_PAGE_MODAL_OPEN_EVENT =
  "audit-react-host-page-modal-open";
export const AUDIT_REACT_HOST_PAGE_MODAL_CLOSED_EVENT =
  "audit-react-host-page-modal-closed";

/** 主站 pathname → sub-react BrowserRouter 的 pathname */
export const hostPathToReactSubPath = (pathname: string): string => {
  const rest = pathname.replace(/^\/audit(?=\/|$)/, "");
  if (rest === "" || rest === "/") return "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
};

/** sub-react 路由 → Wujie 入口 url（Vite history fallback） */
export const reactSubPathToIframeHref = (
  subPath: string,
  reactOrigin: string,
): string => {
  const base = reactOrigin.replace(/\/$/, "");
  return subPath === "/" ? `${base}/` : `${base}${subPath}`;
};
