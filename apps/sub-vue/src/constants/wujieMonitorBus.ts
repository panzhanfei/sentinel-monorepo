/**
 * 与 apps/main-next/src/wujie/wujieMonitorBus.ts 保持一致（事件名勿单方修改）
 */
export const VUE_SUB_NAVIGATE_EVENT = "vue-sub-navigate";
export const MONITOR_VUE_HOST_SYNC_EVENT = "monitor-vue-sync-host";

export const MONITOR_VUE_HOST_PAGE_MODAL_OPEN_EVENT =
  "monitor-vue-host-page-modal-open";
export const MONITOR_VUE_HOST_PAGE_MODAL_CLOSED_EVENT =
  "monitor-vue-host-page-modal-closed";

export interface IWujieHostPageModalOpenPayload {
  title?: string;
}
