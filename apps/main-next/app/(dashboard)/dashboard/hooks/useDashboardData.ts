"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useReadContracts,
  useChainId,
  useWriteContract,
} from "wagmi";
import { erc20Abi, formatUnits, type Address } from "viem";
import { chainToCoinGeckoId, TOKEN_WHITELIST } from "@/app/src/config";
import { publicClient } from "@sentinel/security-sdk";

export type { Address };

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
  risk: "LOW" | "MEDIUM" | "HIGH";
  allowances: AllowanceAudit[];
  details: {
    riskCount: number;
    message: string;
    timestamp: number;
    isNewWallet?: boolean;
  };
}

export interface AgentMessage {
  agent: string;
  status: "thinking" | "done" | "active" | "error";
  content: string;
}

export function useDashboardData() {
  const {
    address: userAddress,
    isConnected,
    isReconnecting,
    status: walletStatus,
    connector: activeConnector,
  } = useAccount();
  const currentChainId = useChainId();
  const { writeContractAsync } = useWriteContract();

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

  const { data: ethBalanceData, isFetching: isEthFetching } = useBalance({
    address: isAccountReady ? userAddress : undefined,
    query: {
      enabled: isAccountReady && !!userAddress,
      retry: 0,
    },
  });

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

  const [ethPrice, setEthPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("IDLE");
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentMessage[]>([]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobId = useRef<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const closeSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  // 1. 市场价格同步
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

  // 2. 初始化：获取历史记录
  useEffect(() => {
    const initDashboard = async () => {
      if (!userAddress) return;
      try {
        const res = await fetch(`/api/scan/latest?address=${userAddress}`);
        if (res.ok) {
          const lastJob = await res.json();
          if (lastJob?.result) {
            setScanResult(lastJob.result);
            setScanStatus("COMPLETED");
            setScanProgress(100);
          }
        }
      } catch (e) {
        console.error("Init failed:", e);
      }
    };
    initDashboard();
  }, [userAddress]);

  // 3. 轮询 Node 端的 Job 状态
  const checkJobStatus = useCallback(async () => {
    if (!currentJobId.current) return;
    try {
      const response = await fetch(`/api/scan/${currentJobId.current}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Fetch status failed");

      const data = await response.json();

      if (data.status) {
        setScanStatus(data.status);
        setScanProgress(data.progress || 0);

        if (data.status === "COMPLETED") {
          setScanResult(data.result);
          stopPolling();
          closeSSE();
        } else if (data.status === "FAILED") {
          stopPolling();
          closeSSE();
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
      setScanStatus("FAILED");
      stopPolling();
      closeSSE();
    }
  }, [stopPolling, closeSSE]);

  // 4. 发起深度扫描（核心修改：SSE 消息合并）
  const handleRunDeepScan = async () => {
    if (!userAddress || scanStatus === "PENDING" || scanStatus === "RUNNING")
      return;

    // 清理之前的连接
    closeSSE();
    stopPolling();

    // UI 预热状态
    setScanStatus("PENDING");
    setScanProgress(0);
    setScanResult(null);
    setAgentLogs([]);
    currentJobId.current = null;

    try {
      // Step A: 请求 BFF 发起扫描，由 Node 生成 jobId
      const startRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: userAddress }),
      });

      if (!startRes.ok) throw new Error("Failed to start scan");

      const { jobId } = await startRes.json();

      if (jobId) {
        currentJobId.current = jobId;

        // Step B: 开启轮询进度条
        pollIntervalRef.current = setInterval(checkJobStatus, 1500);

        // Step C: 开启 SSE 流式终端 (通过 BFF 代理)
        const sse = new EventSource(
          `/api/scan/stream?address=${userAddress}&jobId=${jobId}`,
        );
        sseRef.current = sse;

        sse.onmessage = (event) => {
          try {
            const data: AgentMessage = JSON.parse(event.data);
            setAgentLogs((prev) => {
              const lastIndex = prev.length - 1;
              const last = lastIndex >= 0 ? prev[lastIndex] : null;

              // 合并逻辑：如果最后一条日志与当前消息同 agent 且最后一条为 thinking
              if (
                last &&
                last.agent === data.agent &&
                last.status === "thinking"
              ) {
                if (data.status === "thinking") {
                  // 追加内容（实现逐字输出）
                  const updated = [...prev];
                  updated[lastIndex] = {
                    ...last,
                    content: last.content + data.content,
                  };
                  return updated;
                } else if (data.status === "done" || data.status === "error") {
                  // 将最后一条 thinking 的状态改为 done/error，并更新内容
                  const updated = [...prev];
                  updated[lastIndex] = {
                    ...last,
                    status: data.status,
                    content: data.content || last.content,
                  };
                  return updated;
                }
              }

              // 其他情况（新 Agent、系统消息等）直接追加
              return [...prev, data];
            });
          } catch (e) {
            console.error("Parse SSE error:", e);
          }
        };

        // 处理结束或错误
        sse.addEventListener("end", () => {
          sse.close();
          sseRef.current = null;
        });
        sse.onerror = () => {
          sse.close();
          sseRef.current = null;
        };
      }
    } catch (err) {
      console.error("Scan flow error:", err);
      setScanStatus("FAILED");
    }
  };

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      stopPolling();
      closeSSE();
    };
  }, [stopPolling, closeSSE]);

  // 5. 资产汇总计算
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
          address: config.WETH as Address,
        },
        {
          name: "USD Coin",
          symbol: "USDC",
          val: Number(usdcValue.toFixed(2)),
          price: "$1.00",
          color: "bg-blue-400",
          address: config.USDC as Address,
        },
      ],
    };
  }, [ethBalanceData, erc20BatchData, ethPrice, config]);

  // 6. 撤销授权操作
  const handleRevoke = async (
    tokenAddress: Address,
    spenderAddress: Address,
  ) => {
    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, BigInt(0)],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        // 成功后重新触发扫描以更新 UI
        handleRunDeepScan();
      }
      return hash;
    } catch (error) {
      console.error("Revoke failed:", error);
      throw error;
    }
  };

  const suspiciousCount = scanResult?.details?.riskCount || 0;
  const scanLoading = scanStatus === "PENDING" || scanStatus === "RUNNING";

  return {
    walletStatus,
    address: userAddress,
    isConnected: isAccountReady,
    isFetching: isEthFetching || isTokenFetching,
    assets: portfolioSummary.assets,
    totalValue: portfolioSummary.totalUsd,
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
