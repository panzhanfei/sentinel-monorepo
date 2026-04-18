import { defineComponent } from "vue";
import { RouterLink, useRoute } from "vue-router";

export default defineComponent({
  name: "NoSubRouteMatch",
  setup: () => {
    const route = useRoute();

    return () => (
      <div class="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
        <p class="text-amber-300 mb-4">子应用内未配置该路径</p>
        <pre class="text-xs bg-zinc-900 p-4 rounded-lg border border-zinc-800 overflow-x-auto mb-6">
          {route.fullPath}
        </pre>
        <RouterLink
          to="/"
          class="text-indigo-400 hover:text-indigo-300 underline text-sm"
        >
          返回 /
        </RouterLink>
      </div>
    );
  },
});
