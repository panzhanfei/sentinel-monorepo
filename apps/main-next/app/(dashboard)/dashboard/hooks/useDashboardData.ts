"use client";

import { useAccount } from "wagmi";
import { type Address } from "viem";
import { useMarketData } from "./useMarketData";
import { usePortfolio } from "./usePortfolio";
import { useScan } from "./useScan";
import { useRevoke } from "./useRevoke";

export type { Address };
export type {
  ScanStatus,
  AllowanceAudit,
  ScanResultData,
  AgentMessage,
} from "./types";

export function useDashboardData() {
  const {
    address: userAddress,
    isConnected,
    isReconnecting,
    status: walletStatus,
    connector: activeConnector,
  } = useAccount();

  const isAccountReady =
    isConnected &&
    !isReconnecting &&
    walletStatus === "connected" &&
    !!activeConnector;

  // 市场数据（价格、涨跌幅）
  const { ethPrice, priceChange } = useMarketData();

  // 资产组合（余额、总价值）
  const { assets, totalValue, isFetching } = usePortfolio({
    enabled: isAccountReady && !!userAddress,
    address: userAddress,
    ethPrice,
  });

  // 扫描状态管理（SSE、轮询、结果）
  const {
    scanProgress,
    scanStatus,
    scanResult,
    agentLogs,
    suspiciousCount,
    scanLoading,
    handleRunDeepScan,
  } = useScan({
    enabled: isAccountReady,
    address: userAddress,
  });

  // 撤销授权
  const { handleRevoke } = useRevoke({ onSuccess: handleRunDeepScan });

  return {
    walletStatus,
    address: userAddress,
    isConnected: isAccountReady,
    isFetching,
    assets,
    totalValue,
    priceChange,
    scanProgress,
    scanStatus,
    scanResult,
    agentLogs,
    suspiciousCount,
    scanLoading,
    handleRunDeepScan,
    handleRevoke,
  };
}
