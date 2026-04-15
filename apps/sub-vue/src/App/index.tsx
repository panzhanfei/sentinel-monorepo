import { defineComponent } from "vue";
import MonitorDashboard from "@/views/MonitorDashboard";
import { useAppData } from "./useData";

export default defineComponent({
  name: "App",
  setup: () => {
        useAppData();

        return () => (
          <div class="max-w-7sxl mx-auto h-screen flex flex-col pb-30">
            <MonitorDashboard />
          </div>
        );
      },
});
