import { computed, type Ref } from "vue";

/** 图表用的最小资产行（原生 / ERC-20） */
export interface ChartBalanceRow {
  symbol: string;
  balance: string;
}

export function useMonitorCharts(
  chainBalances: Ref<readonly ChartBalanceRow[]>,
  customTokens: Ref<readonly ChartBalanceRow[]>,
) {
  // V-2: 资产分布饼图数据
  const distributionData = computed(() => {
    const data = chainBalances.value.map((c) => ({
      name: c.symbol,
      value: parseFloat(c.balance) || 0,
    }));
    // 加上自定义代币
    customTokens.value.forEach((t) => {
      data.push({ name: t.symbol, value: parseFloat(t.balance) || 0 });
    });
    return data.filter((d) => d.value > 0);
  });

  const trendData = computed(() => {
    const base = chainBalances.value.reduce(
      (acc, cur) => acc + parseFloat(cur.balance),
      0,
    );
    return {
      dates: ["12:00", "14:00", "16:00", "18:00", "20:00", "Now"],
      values: [
        base * 0.9,
        base * 0.95,
        base * 1.1,
        base * 1.05,
        base * 0.98,
        base,
      ],
    };
  });

  return { distributionData, trendData };
}
