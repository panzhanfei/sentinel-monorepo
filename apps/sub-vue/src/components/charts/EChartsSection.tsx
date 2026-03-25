import { defineComponent, ref, onMounted, onUnmounted, watch } from "vue";
import type { PropType } from "vue";
import type { DistributionSlice, TrendSeries } from "@/types/monitor";

import * as echarts from "echarts/core";
import { PieChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  CanvasRenderer,
  PieChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

export const EChartsSection = defineComponent({
  name: "EChartsSection",
  props: {
    distributionData: Array as PropType<DistributionSlice[]>,
    trendData: Object as PropType<TrendSeries>,
  },
  setup(props) {
    const pieChartRef = ref<HTMLElement>();
    const lineChartRef = ref<HTMLElement>();

    let pieChart: echarts.ECharts | null = null;
    let lineChart: echarts.ECharts | null = null;

    const getPieOption = () => ({
      backgroundColor: "transparent",
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["60%", "85%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#050505",
            borderWidth: 4,
          },
          label: { show: false },
          data: props.distributionData || [],
        },
      ],
    });

    const getLineOption = () => ({
      backgroundColor: "transparent",
      grid: { top: 20, bottom: 20, left: 40, right: 10 },
      xAxis: {
        type: "category",
        data: props.trendData?.dates || [],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#52525b", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } },
        axisLabel: { color: "#52525b", fontSize: 10 },
      },
      series: [
        {
          data: props.trendData?.values || [],
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#10b981", width: 3 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(16,185,129,0.3)" },
                { offset: 1, color: "transparent" },
              ],
            },
          },
        },
      ],
    });

    const initCharts = () => {
      if (pieChartRef.value) {
        pieChart = echarts.init(pieChartRef.value);
        pieChart.setOption(getPieOption());
      }
      if (lineChartRef.value) {
        lineChart = echarts.init(lineChartRef.value);
        lineChart.setOption(getLineOption());
      }
    };

    const updateCharts = () => {
      if (pieChart) {
        pieChart.setOption(getPieOption(), { notMerge: false });
      }
      if (lineChart) {
        lineChart.setOption(getLineOption(), { notMerge: false });
      }
    };

    const handleResize = () => {
      pieChart?.resize();
      lineChart?.resize();
    };

    onMounted(() => {
      initCharts();
      window.addEventListener("resize", handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
      pieChart?.dispose();
      lineChart?.dispose();
    });

    watch(
      () => [props.distributionData, props.trendData],
      () => {
        updateCharts();
      },
      { deep: true },
    );

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
