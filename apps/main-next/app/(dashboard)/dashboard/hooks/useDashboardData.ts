"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useReadContracts,
  useChainId,
  useWriteContract,
} from "wagmi";
import { erc20Abi, formatUnits, Address } from "viem";
import { chainToCoinGeckoId, TOKEN_WHITELIST } from "@/app/src/config";
import { publicClient } from "@sentinel/security-sdk";

// --- 类型定义 ---
export type ScanStatus =
  | "IDLE"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export interface AllowanceAudit {
  tokenSymbol: string;
  tokenAddress: string;
  spenderName: string;
  spenderAddress: string;
  allowance: string;
  rawAllowance: string;
}

export interface ScanResultData {
  eth_balance: string;
  tx_count: number;
  allowances: AllowanceAudit[];
  risk: "LOW" | "MEDIUM" | "HIGH";
  details: { isNewWallet: boolean; riskCount: number; message: string };
  timestamp: number;
}

export function useDashboardData() {
  // 1. 获取账户状态
  const {
    address: userAddress,
    isConnected,
    isReconnecting,
    status: walletStatus,
    connector: activeConnector,
  } = useAccount();
  const currentChainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  // 🛡️ Aave Wallet 连接防护盾
  const isAccountReady = useMemo(() => {
    return (
      isConnected &&
      !isReconnecting &&
      walletStatus === "connected" &&
      !!activeConnector
    );
  }, [isConnected, isReconnecting, walletStatus, activeConnector]);

  const config = useMemo(() => {
    return TOKEN_WHITELIST[currentChainId] || TOKEN_WHITELIST[1];
  }, [currentChainId]);

  // 2. 原生余额查询
  const { data: ethBalanceData, isFetching: isEthFetching } = useBalance({
    address: isAccountReady ? userAddress : undefined,
    query: {
      enabled: isAccountReady && !!userAddress,
      retry: 0,
    },
  });

  // 3. 代币余额查询
  const { data: erc20BatchData, isFetching: isTokenFetching } =
    useReadContracts({
      contracts: [
        {
          address: config.USDC,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress as `0x${string}`],
        },
      ],
      query: {
        enabled: isAccountReady && !!userAddress,
        retry: 0,
      },
    });

  // 4. 业务状态管理
  const [ethPrice, setEthPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("IDLE");
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);

  // 关键：使用 Ref 记录当前扫描的 Job ID 和定时器
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobId = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // 5. 价格轮询 (保持不变)
  useEffect(() => {
    const fetchMarketData = async () => {
      const cgId = chainToCoinGeckoId[currentChainId] || "ethereum";
      try {
        const pRes = await fetch(`/api/price?ids=${cgId}`);
        const pData = await pRes.json();
        if (pData[cgId]) {
          setEthPrice(pData[cgId].usd);
          setPriceChange(pData[cgId].usd_24h_change);
        }
      } catch (err) {
        console.warn("Market sync deferred");
      }
    };
    fetchMarketData();
    const timer = setInterval(fetchMarketData, 60000);
    return () => clearInterval(timer);
  }, [currentChainId]);

  useEffect(() => {
    const initDashboard = async () => {
      if (!userAddress) return;
      const res = await fetch(`/api/scan/latest?address=${userAddress}`);
      if (res.ok) {
        const lastJob = await res.json();
        if (lastJob?.result) {
          setScanResult(lastJob.result);
          setScanStatus("COMPLETED");
          setScanProgress(100);
        }
      }
    };
    initDashboard();
  }, [userAddress]);

  // 6. 核心修改：基于 Job ID 的状态轮询
  const checkJobStatus = useCallback(async () => {
    if (!currentJobId.current) return;

    try {
      // 增加时间戳防止任何形式的缓存
      const response = await fetch(
        `/api/scan/${currentJobId.current}?t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();

      // 根据 [jobId]/route.ts 返回的结构更新
      if (data.status) {
        setScanStatus(data.status);
        setScanProgress(data.progress || 0);

        if (data.status === "COMPLETED") {
          // 因为后端直接返回了 job 对象，所以这里直接取 data.result
          setScanResult(data.result);
          stopPolling();
        } else if (data.status === "FAILED") {
          stopPolling();
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
      setScanStatus("FAILED");
      stopPolling();
    }
  }, [stopPolling]);

  // 7. 发起深度扫描
  const handleRunDeepScan = async () => {
    if (!userAddress || scanStatus === "PENDING" || scanStatus === "RUNNING")
      return;

    // 重置状态
    setScanStatus("PENDING");
    setScanProgress(0);
    setScanResult(null);
    currentJobId.current = null;

    try {
      const requestId = crypto.randomUUID();
      const startRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: userAddress, requestId }),
      });

      if (startRes.ok) {
        const { jobId } = await startRes.json();
        if (jobId) {
          currentJobId.current = jobId; // 记录 ID
          // 立即执行一次检查，然后开启轮询
          checkJobStatus();
          pollIntervalRef.current = setInterval(checkJobStatus, 1500);
        } else {
          throw new Error("No jobId returned");
        }
      } else {
        setScanStatus("FAILED");
      }
    } catch (err) {
      console.error("Scan start error:", err);
      setScanStatus("FAILED");
    }
  };

  // 8. 衍生计算：资产组合
  const portfolioSummary = useMemo(() => {
    const ethValue = ethBalanceData
      ? Number(formatUnits(ethBalanceData.value, ethBalanceData.decimals))
      : 0;
    const usdcRaw = (erc20BatchData?.[0]?.result as bigint) || BigInt(0);
    const usdcValue = Number(formatUnits(usdcRaw, 6));

    return {
      totalUsd: ethValue * ethPrice + usdcValue * 1.0,
      assets: [
        {
          name: "Ethereum",
          symbol: "ETH",
          val: Number(ethValue.toFixed(4)),
          price: `${ethPrice.toLocaleString()}`,
          color: "bg-indigo-500",
          address: "0xE94FF2028d97Ff74A1930f7701a1bD84B22c6C7e",
        },
        {
          name: "USD Coin",
          symbol: "USDC",
          val: Number(usdcValue.toFixed(2)),
          price: "$1.00",
          color: "bg-blue-400",
          address: "0xE94FF2028d97Ff74A1930f7701a1bD84B22c6C7e",
        },
      ],
    };
  }, [ethBalanceData, erc20BatchData, ethPrice]);

  // 撤销授权函数
  const handleRevoke = async (
    tokenAddress: Address,
    spenderAddress: Address,
  ) => {
    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, BigInt(0)], // 💡 核心逻辑：将授权额度设为 0
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        console.log("✅ 撤销成功，正在触发深度扫描同步状态...");
        handleRunDeepScan();
      } else {
        console.error("❌ 交易被拒绝或执行失败（Reverted）");
      }
      return hash;
    } catch (error) {
      console.error("撤销操作失败:", error);
      throw error;
    }
  };

  const suspiciousTarget = scanResult?.allowances?.[0]?.spenderName || "None";
  const suspiciousCount =
    scanResult?.allowances?.filter((a) => parseFloat(a.allowance) > 0).length ||
    0;
  const scanLoading = scanStatus === "PENDING" || scanStatus === "RUNNING";
  return {
    address: userAddress,
    isConnected: isAccountReady,
    isFetching: isEthFetching || isTokenFetching,
    assets: portfolioSummary.assets,
    totalValue: portfolioSummary.totalUsd,
    priceChange,
    scanProgress,
    scanStatus,
    scanResult,
    suspiciousCount,
    suspiciousTarget,
    scanLoading,
    handleRunDeepScan,
    handleRevoke,
  };
}
