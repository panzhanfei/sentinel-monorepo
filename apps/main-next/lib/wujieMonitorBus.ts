/**
 * 与 apps/sub-vue/src/constants/wujieMonitorBus.ts 保持一致（事件名勿单方修改）
 */
export const VUE_SUB_NAVIGATE_EVENT = "vue-sub-navigate";
export const MONITOR_VUE_HOST_SYNC_EVENT = "monitor-vue-sync-host";

/** 主站 pathname → sub-vue 的 path */
export function hostPathToVueSubPath(pathname: string): string {
  const rest = pathname.replace(/^\/monitor(?=\/|$)/, "");
  if (rest === "" || rest === "/") return "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

export function vueSubPathToIframeHref(
  subPath: string,
  vueOrigin: string,
): string {
  const base = vueOrigin.replace(/\/$/, "");
  return subPath === "/" ? `${base}/` : `${base}${subPath}`;
}
