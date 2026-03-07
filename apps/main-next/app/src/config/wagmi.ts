// src/wagmi.ts
import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, sepolia, anvil } from "wagmi/chains";

export const config = createConfig(
  getDefaultConfig({
    // 你的 dApp 需要支持的链
    chains: [mainnet, polygon, arbitrum, sepolia, anvil],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
      [anvil.id]: http("http://127.0.0.1:8545"),
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
