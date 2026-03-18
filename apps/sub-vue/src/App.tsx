import { defineComponent, onMounted } from "vue";
import { useWeb3Store } from "@/stores/";
import MonitorDashboard from "@/views/MonitorDashboard";

export default defineComponent({
  name: "App",
  setup() {
    const web3Store = useWeb3Store();

    onMounted(() => {
      web3Store.wujieAfterMount?.();
    });

    return () => (
      <div class="max-w-7sxl mx-auto h-screen flex flex-col pb-30">
        <MonitorDashboard />
      </div>
    );
  },
});
