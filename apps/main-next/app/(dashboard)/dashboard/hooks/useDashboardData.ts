"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAccount, useBalance, useReadContracts, useChainId } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { chainToCoinGeckoId, TOKEN_WHITELIST } from "@/app/src/config";

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

  // 2. 批量获取 ERC-20 余额 (使用 Multicall 逻辑)
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
  const [scanLoading, setScanLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<
    "Idle" | "pending" | "processing" | "completed"
  >("Idle");
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // 4. 资产解析与汇总
  const portfolio = useMemo(() => {
    // 处理 ETH
    const ethVal = ethBalanceData
      ? Number(formatUnits(ethBalanceData.value, ethBalanceData.decimals))
      : 0;

    // 处理 USDC (解决 BigInt 字面量报错，使用 BigInt(0))
    const usdcRaw = (tokenData?.[0]?.result as bigint) || BigInt(0);
    const usdcVal = Number(formatUnits(usdcRaw, 6));

    // 计算总价值
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

  // 5. 价格轮询 (接入 Next.js API 代理)
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

  // 6. 扫描逻辑 (此处逻辑保持不变)
  const checkScanStatus = async () => {
    if (!address) return;
    try {
      const res = await fetch(
        `/api/scan/status?address=${address.toLowerCase()}`,
      );
      const data = await res.json();
      if (data.status) {
        setScanStatus(data.status);
        setScanProgress(data.progress || 0);
        if (data.status === "completed") {
          setScanLoading(false);
          if (pollTimer.current) clearInterval(pollTimer.current);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRunDeepScan = async () => {
    if (!address || scanLoading) return;
    setScanLoading(true);
    setScanProgress(0);
    setScanStatus("pending");
    try {
      await fetch("/api/scan/run", {
        method: "POST",
        body: JSON.stringify({ address }),
      });
      pollTimer.current = setInterval(checkScanStatus, 1000);
    } catch {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  return {
    address,
    isFetching: isEthFetching || isTokenFetching,
    assets: portfolio.assets,
    totalValue: portfolio.totalValue,
    priceChange,
    scanLoading,
    scanProgress,
    scanStatus,
    handleRunDeepScan,
  };
}
