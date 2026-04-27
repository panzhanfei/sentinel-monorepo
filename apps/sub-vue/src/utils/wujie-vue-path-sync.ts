import type { Router } from "vue-router";
import {
  VUE_SUB_NAVIGATE_EVENT,
  MONITOR_VUE_HOST_SYNC_EVENT,
} from "@/constants";

/**
 * 宿主 Next `/monitor/**` ↔ 子应用 vue-router；需在应用挂载后调用（保证 window.$wujie.bus 可用）。
 */
export const initWujieVuePathSync = (router: Router): (() => void) => {
  const onHostNavigate = (path: unknown) => {
    const p = typeof path === "string" ? path : "/";
    if (p === router.currentRoute.value.path) return;
    void router.push(p);
  };

  const attach = (): (() => void) | null => {
    const bus = window.$wujie?.bus;
    if (!bus) return null;

    bus.$on(VUE_SUB_NAVIGATE_EVENT, onHostNavigate);
    const removeAfterEach = router.afterEach((to) => {
      bus.$emit(MONITOR_VUE_HOST_SYNC_EVENT, { path: to.path });
    });

    return () => {
      bus.$off(VUE_SUB_NAVIGATE_EVENT, onHostNavigate);
      if (typeof removeAfterEach === "function") {
        removeAfterEach();
      }
    };
  };

  let detach = attach();
  let retryId: number | undefined;

  if (!detach) {
    retryId = window.setTimeout(() => {
      detach = attach();
    }, 100);
  }

  return () => {
    if (retryId !== undefined) window.clearTimeout(retryId);
    detach?.();
  };
};
