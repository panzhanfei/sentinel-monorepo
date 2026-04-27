import { defineComponent } from "vue";
import { RouterLink } from "vue-router";
import { MonitorDashboard } from "@/views";
import { useAppData } from "@/hooks";

export default defineComponent({
  name: "MonitorHome",
  setup: () => {
    useAppData();

    return () => (
      <>
        <div class="fixed bottom-3 right-3 z-50 text-xs font-mono">
          <RouterLink
            to="/wujie-sub-route-test"
            class="text-zinc-500 hover:text-emerald-400 underline decoration-zinc-600"
          >
            Wujie 子路由测试
          </RouterLink>
        </div>
        <div class="max-w-7xl mx-auto h-screen flex flex-col pb-30">
          <MonitorDashboard />
        </div>
      </>
    );
  },
});
