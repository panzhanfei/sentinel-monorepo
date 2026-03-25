import type {
  ChartBalanceRow,
  DistributionSlice,
  TrendSeries,
} from "@/types/monitor";

/** 由余额行推导饼图数据（纯函数，便于单测） */
export function buildDistributionSlices(
  chainBalances: readonly ChartBalanceRow[],
  customTokens: readonly ChartBalanceRow[],
): DistributionSlice[] {
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

/** 由原生链余额总和推导趋势序列（演示用比例曲线） */
export function buildTrendSeries(
  chainBalances: readonly ChartBalanceRow[],
): TrendSeries {
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
