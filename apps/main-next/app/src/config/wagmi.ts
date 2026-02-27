// src/wagmi.ts
import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, sepolia  } from "wagmi/chains";

export const config = createConfig(
  getDefaultConfig({
    // 你的 dApp 需要支持的链
    chains: [mainnet, polygon, arbitrum, sepolia],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
    },

    // 必填项
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    appName: "OmniChain Sentinel",

    // 可选项
    // appDescription: "Next-gen Web3 Asset Management",
    // appUrl: "https://your-dapp.com",
    // appIcon: "https://your-dapp.com/logo.png",
  })
);
