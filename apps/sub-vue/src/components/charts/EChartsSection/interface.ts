import type { DistributionSlice, TrendSeries } from "@/types/monitor";

export interface IProps {
  distributionData?: DistributionSlice[];
  trendData?: TrendSeries;
}
