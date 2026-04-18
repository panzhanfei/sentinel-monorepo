import { defineComponent } from "vue";
import type { IEChartsSectionProps } from "./interface";
import { useEChartsSectionData, useEChartsSectionOptionsData } from "./useData";

export const EChartsSection = defineComponent({
  name: "EChartsSection",
  ...useEChartsSectionOptionsData(),
  setup: (props: IEChartsSectionProps) => {
      const { pieChartRef, lineChartRef } = useEChartsSectionData(props);

      return () => (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-4xl backdrop-blur-xl">
            <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
              Asset_Distribution
            </h3>
            <div ref={pieChartRef} class="h-60" />
          </div>
          <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-4xl backdrop-blur-xl">
            <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
              24H_Portfolio_Trend
            </h3>
            <div ref={lineChartRef} class="h-60" />
          </div>
        </div>
      );
    },
});
