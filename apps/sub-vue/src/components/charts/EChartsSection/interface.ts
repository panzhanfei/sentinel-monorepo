import type { DistributionSlice, TrendSeries } from "@/types/monitor";

export interface IEChartsSectionProps {
  distributionData?: DistributionSlice[];
  trendData?: TrendSeries;
}
