import { defineComponent, onBeforeUnmount, onMounted, Suspense } from "vue";
import { RouterView, useRouter } from "vue-router";
import { initWujieVuePathSync } from "@/utils/wujie-vue-path-sync";

export default defineComponent({
  name: "App",
  setup: () => {
    const router = useRouter();
    let stopPathSync: (() => void) | undefined;

    onMounted(() => {
      stopPathSync = initWujieVuePathSync(router);
    });
    onBeforeUnmount(() => {
      stopPathSync?.();
    });

    return () => (
      <Suspense>
        {{
          default: () => <RouterView />,
          fallback: () => (
            <div class="flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-sm text-zinc-500">
              加载中…
            </div>
          ),
        }}
      </Suspense>
    );
  },
});
