import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type {
  ChartBalanceRow,
  DistributionSlice,
  TrendSeries,
} from "@/types/monitor";

export const buildDistributionSlices = (chainBalances: readonly ChartBalanceRow[], customTokens: readonly ChartBalanceRow[]) : DistributionSlice[] => {
  const data: DistributionSlice[] = chainBalances.map((c) => ({
    name: c.symbol,
    value: parseFloat(c.balance) || 0,
  }));
  customTokens.forEach((t) => {
    data.push({ name: t.symbol, value: parseFloat(t.balance) || 0 });
  });
  return data.filter((d) => d.value > 0);
}

const TREND_HOURS = ["12:00", "14:00", "16:00", "18:00", "20:00", "Now"] as const;

export const buildTrendSeries = (chainBalances: readonly ChartBalanceRow[]) : TrendSeries => {
  const base = chainBalances.reduce(
    (acc, cur) => acc + parseFloat(cur.balance),
    0,
  );
  return {
    dates: [...TREND_HOURS],
    values: [
      base * 0.9,
      base * 0.95,
      base * 1.1,
      base * 1.05,
      base * 0.98,
      base,
    ],
  };
}

export const useChartSeries = (chainBalances: MaybeRefOrGetter<readonly ChartBalanceRow[]>, customTokens: MaybeRefOrGetter<readonly ChartBalanceRow[]>) => {
  const distributionData = computed(() =>
    buildDistributionSlices(toValue(chainBalances), toValue(customTokens)),
  );
  const trendData = computed(() => buildTrendSeries(toValue(chainBalances)));
  return { distributionData, trendData };
}
