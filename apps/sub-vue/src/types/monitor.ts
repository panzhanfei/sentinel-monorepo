/** 监控看板领域类型（与 UI 解耦） */

export interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: string;
  symbol: string;
  height: number;
  loading: boolean;
  isError?: boolean;
}

export interface TokenBalance {
  id: string;
  chainId: number;
  chainName: string;
  address: string;
  symbol: string;
  balance: string;
  loading: boolean;
  isError?: boolean;
}

/** 图表聚合用的最小行（原生 / ERC-20 共有字段） */
export interface ChartBalanceRow {
  symbol: string;
  balance: string;
}

export interface DistributionSlice {
  name: string;
  value: number;
}

export interface TrendSeries {
  dates: string[];
  values: number[];
}
