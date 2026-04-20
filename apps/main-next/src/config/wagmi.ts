// src/wagmi.ts
import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, sepolia, anvil } from "wagmi/chains";

const fallbackRpcUrl =
  process.env.NEXT_PUBLIC_ANVIL_RPC_URL ??
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ??
  "http://127.0.0.1:8545";

export const config = createConfig(
  getDefaultConfig({
    // 你的 dApp 需要支持的链
    chains: [mainnet, polygon, arbitrum, sepolia, anvil],
    transports: {
      // 统一使用项目配置的 RPC，避免命中 wagmi 默认公共节点（如 eth.merkle.io）。
      [mainnet.id]: http(
        process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? fallbackRpcUrl,
      ),
      [polygon.id]: http(
        process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? fallbackRpcUrl,
      ),
      [arbitrum.id]: http(
        process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ?? fallbackRpcUrl,
      ),
      [sepolia.id]: http(
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? fallbackRpcUrl,
      ),
      [anvil.id]: http(process.env.NEXT_PUBLIC_ANVIL_RPC_URL ?? fallbackRpcUrl),
    },

    // 必填项
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    appName: "OmniChain Sentinel",

    // 可选项
    // appDescription: "Next-gen Web3 Asset Management",
    // appUrl: "https://your-dapp.com",
    // appIcon: "https://your-dapp.com/logo.png",
  }),
);

export const chainToCoinGeckoId: Record<number, string> = {
  1: "ethereum",
  137: "matic-network",
  42161: "arbitrum",
  31337: "ethereum", // Anvil 本地链映射到以太坊价格
};
