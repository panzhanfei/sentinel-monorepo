import { ref, watch, onMounted, onUnmounted } from "vue";
import type { ComponentObjectPropsOptions, PropType } from "vue";
import * as echarts from "echarts/core";
import { PieChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { IProps } from "./interface";

echarts.use([
  CanvasRenderer,
  PieChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

const eChartsSectionPropsOptions: ComponentObjectPropsOptions<IProps> = {
  distributionData: Array as PropType<NonNullable<IProps["distributionData"]>>,
  trendData: Object as PropType<NonNullable<IProps["trendData"]>>,
};

export const useEChartsSectionData = (props: IProps) => {
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

  return { pieChartRef, lineChartRef };
}

export const useEChartsSectionOptionsData = () => {
  return { props: eChartsSectionPropsOptions };
}
