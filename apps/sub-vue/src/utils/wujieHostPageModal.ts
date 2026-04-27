import {
  MONITOR_VUE_HOST_PAGE_MODAL_OPEN_EVENT,
  type IWujieHostPageModalOpenPayload,
} from "@/constants";

export type { IWujieHostPageModalOpenPayload };

export const emitMonitorHostPageModalToHost = (
  payload: IWujieHostPageModalOpenPayload = {},
) => {
  try {
    window.$wujie?.bus?.$emit(MONITOR_VUE_HOST_PAGE_MODAL_OPEN_EVENT, payload);
  } catch {
    /* 独立运行 */
  }
};
