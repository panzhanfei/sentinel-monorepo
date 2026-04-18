import { defineComponent } from "vue";
import { RouterLink, useRoute } from "vue-router";

export default defineComponent({
  name: "WujieSubRouteTest",
  setup: () => {
    const route = useRoute();

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
