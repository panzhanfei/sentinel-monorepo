"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAccount, useBalance, useReadContracts, useChainId } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { chainToCoinGeckoId, TOKEN_WHITELIST } from "@/app/src/config";

// 定义与后端严格一致的状态枚举
export type ScanStatus =
  | "IDLE"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export function useDashboardData() {
  const { address } = useAccount();
  const chainId = useChainId();

  // 根据当前链获取配置
  const config = useMemo(() => {
    return TOKEN_WHITELIST[chainId] || TOKEN_WHITELIST[1];
  }, [chainId]);

  // 1. 获取原生 ETH 余额
  const { data: ethBalanceData, isFetching: isEthFetching } = useBalance({
    address,
  });

  // 2. 批量获取 ERC-20 余额
  const { data: tokenData, isFetching: isTokenFetching } = useReadContracts({
    contracts: [
      {
        address: config.USDC,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      },
    ],
    query: { enabled: !!address },
  });

  // 3. 价格与扫描状态
  const [ethPrice, setEthPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("IDLE");

  // 使用 useRef 管理定时器，确保清理彻底
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // 4. 资产解析与汇总
  const portfolio = useMemo(() => {
    const ethVal = ethBalanceData
      ? Number(formatUnits(ethBalanceData.value, ethBalanceData.decimals))
      : 0;

    const usdcRaw = (tokenData?.[0]?.result as bigint) || BigInt(0);
    const usdcVal = Number(formatUnits(usdcRaw, 6));

    const totalValue = ethVal * ethPrice + usdcVal * 1.0;

    return {
      totalValue,
      assets: [
        {
          name: "Ethereum",
          symbol: "ETH",
          val: Number(ethVal.toFixed(4)),
          price: `${ethPrice.toLocaleString()}`,
          color: "bg-indigo-500",
        },
        {
          name: "USD Coin",
          symbol: "USDC",
          val: Number(usdcVal.toFixed(2)),
          price: "$1.00",
          color: "bg-blue-400",
        },
      ],
    };
  }, [ethBalanceData, tokenData, ethPrice]);

  // 5. 价格轮询
  useEffect(() => {
    const fetchPrice = async () => {
      const cgId = chainToCoinGeckoId[chainId] || "ethereum";
      try {
        const res = await fetch(`/api/price?ids=${cgId}`);
        const data = await res.json();
        if (data[cgId]) {
          setEthPrice(data[cgId].usd);
          setPriceChange(data[cgId].usd_24h_change);
        }
      } catch (e) {
        console.error("Price fetch failed");
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [chainId]);

  // 6. 停止轮询的函数
  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // 7. 检查状态的函数 (对接你重构的 /api/status)
  const checkScanStatus = useCallback(async () => {
    if (!address) return;
    try {
      // 路由务必与你刚才写的 status/route.ts 保持一致
      const res = await fetch(
        `/api/scan/status?address=${address.toLowerCase()}`,
      );
      const data = await res.json();

      if (data.status) {
        setScanStatus(data.status as ScanStatus);
        setScanProgress(data.progress || 0);

        // 如果后端返回完成或失败，停止请求
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          stopPolling();
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
      setScanStatus("FAILED");
      stopPolling();
    }
  }, [address, stopPolling]);

  // 8. 发起深度扫描
  const handleRunDeepScan = async () => {
    if (!address || scanStatus === "PENDING" || scanStatus === "RUNNING")
      return;

    // 立即进入等待状态，防止重复点击
    setScanStatus("PENDING");
    setScanProgress(0);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (res.ok) {
        // 发起成功后，开始高频轮询
        pollTimer.current = setInterval(checkScanStatus, 1500);
      } else {
        setScanStatus("FAILED");
      }
    } catch (error) {
      console.error("Start scan failed:", error);
      setScanStatus("FAILED");
    }
  };

  // 9. 监听地址变化：如果切换账号，重置状态
  useEffect(() => {
    stopPolling();
    setScanStatus("IDLE");
    setScanProgress(0);
  }, [address, stopPolling]);

  // 销毁组件时清理定时器
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    address,
    isFetching: isEthFetching || isTokenFetching,
    assets: portfolio.assets,
    totalValue: portfolio.totalValue,
    priceChange,
    scanProgress,
    scanStatus,
    scanLoading: scanStatus === "PENDING" || scanStatus === "RUNNING",
    handleRunDeepScan,
  };
}
