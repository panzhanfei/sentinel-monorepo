import { defineComponent, ref, onMounted, onUnmounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { MONITOR_VUE_HOST_PAGE_MODAL_CLOSED_EVENT } from "@/constants/wujieMonitorBus";
import { emitMonitorHostPageModalToHost } from "@/utils/wujieHostPageModal";

export default defineComponent({
  name: "WujieSubRouteTest",
  setup: () => {
    const route = useRoute();
    const hostModalClosedHint = ref<string | null>(null);

    const onHostClosed = () => {
      hostModalClosedHint.value = `宿主弹窗已关闭（${new Date().toLocaleTimeString()}）`;
    };

    onMounted(() => {
      window.$wujie?.bus?.$on(
        MONITOR_VUE_HOST_PAGE_MODAL_CLOSED_EVENT,
        onHostClosed,
      );
    });

    onUnmounted(() => {
      window.$wujie?.bus?.$off(
        MONITOR_VUE_HOST_PAGE_MODAL_CLOSED_EVENT,
        onHostClosed,
      );
    });

    return () => (
      <div class="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
        <div class="max-w-xl space-y-6">
          <h1 class="text-lg font-semibold text-emerald-400">
            Wujie 子路由测试页（Vue）
          </h1>
          <p class="text-sm text-zinc-400">
            主站路径应为 /monitor/wujie-sub-route-test；可单独打开子应用端口对照。
          </p>
          <dl class="space-y-2 text-sm border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
            <div>
              <dt class="text-zinc-500">vue-router route.path</dt>
              <dd class="text-amber-200 break-all">{route.path}</dd>
            </div>
            <div>
              <dt class="text-zinc-500">route.fullPath</dt>
              <dd class="break-all">{route.fullPath}</dd>
            </div>
            <div>
              <dt class="text-zinc-500">window.location.href</dt>
              <dd class="text-amber-200/90 break-all text-xs">
                {typeof window !== "undefined" ? window.location.href : "—"}
              </dd>
            </div>
          </dl>
          <div class="space-y-2">
            <button
              type="button"
              class="rounded-lg border border-emerald-700 bg-emerald-950/50 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-900/60"
              onClick={() =>
                emitMonitorHostPageModalToHost({
                  title: "监控子应用 · 宿主页面级弹窗",
                })
              }
            >
              打开宿主页面级弹窗（bus → Next）
            </button>
            {hostModalClosedHint.value ? (
              <p class="text-xs text-zinc-500">{hostModalClosedHint.value}</p>
            ) : null}
          </div>
          <RouterLink
            to="/"
            class="inline-block text-sm text-indigo-400 hover:text-indigo-300 underline"
          >
            ← 返回监控首页（/）
          </RouterLink>
        </div>
      </div>
    );
  },
});
