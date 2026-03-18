import { computed } from "vue";

export function useMonitorCharts(chainBalances: any, customTokens: any) {
  // V-2: 资产分布饼图数据
  const distributionData = computed(() => {
    const data = chainBalances.value.map((c: any) => ({
      name: c.symbol,
      value: parseFloat(c.balance) || 0,
    }));
    // 加上自定义代币
    customTokens.value.forEach((t: any) => {
      data.push({ name: t.symbol, value: parseFloat(t.balance) || 0 });
    });
    return data.filter((d: any) => d.value > 0);
  });

  const trendData = computed(() => {
    const base = chainBalances.value.reduce(
      (acc: number, cur: any) => acc + parseFloat(cur.balance),
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
