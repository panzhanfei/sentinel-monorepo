import { useAccount, useBalance, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48";

// 目前先硬编码价格，后续可替换为 API 获取
const PRICES = {
  ETH: 2341, //
  USDC: 1.0, //
};

export function useAssetsData() {
  const { address } = useAccount();

  const eth = useBalance({ address });

  const usdc = useReadContract({
    abi: erc20Abi,
    address: USDC_ADDRESS,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const isLoading = eth.isLoading || usdc.isLoading;

  const assets = [
    {
      name: "Ethereum",
      symbol: "ETH",
      val: eth.data
        ? formatUnits(eth.data.value, eth.data.decimals) // 保持原始字符串，UI渲染时再toFixed
        : "0.0000",
      price: `$${PRICES.ETH.toLocaleString()}`, // 用于 UI 显示
      rawPrice: PRICES.ETH, // 用于逻辑计算
      color: "bg-blue-500",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      val: usdc.data ? formatUnits(usdc.data as bigint, 6) : "0.00",
      price: `$${PRICES.USDC.toFixed(2)}`, //
      rawPrice: PRICES.USDC,
      color: "bg-indigo-400",
    },
  ];

  // 计算总价值 (Total Net Worth)
  const totalNetWorth = assets.reduce((acc, asset) => {
    return acc + Number(asset.val) * asset.rawPrice;
  }, 0);

  return { assets, totalNetWorth, isLoading };
}
