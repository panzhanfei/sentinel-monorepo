import { useMemo } from "react";
import { useBalance, useReadContracts, useChainId } from "wagmi";
import { erc20Abi, formatUnits, type Address } from "viem";
import { TOKEN_WHITELIST } from "@/app/src/config";

export function usePortfolio({
  enabled,
  address,
  ethPrice,
}: {
  enabled: boolean;
  address?: Address;
  ethPrice: number;
}) {
  const chainId = useChainId(); // ✅ 直接调用
  const config = TOKEN_WHITELIST[chainId] || TOKEN_WHITELIST[1]; // 降级到主网

  const { data: ethBalanceData, isFetching: isEthFetching } = useBalance({
    address: enabled ? address : undefined,
    query: { enabled, retry: 0 },
  });

  const { data: erc20BatchData, isFetching: isTokenFetching } =
    useReadContracts({
      contracts: [
        {
          address: config.USDC,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        },
      ],
      query: { enabled, retry: 0 },
    });

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

  return {
    assets: portfolioSummary.assets,
    totalValue: portfolioSummary.totalUsd,
    isFetching: isEthFetching || isTokenFetching,
  };
}
