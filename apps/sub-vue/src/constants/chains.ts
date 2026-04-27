// @/constants.ts
import { mainnet, arbitrum, optimism, polygon, anvil } from "viem/chains";

const anvilRpcUrl =
  import.meta.env.VITE_ANVIL_RPC_URL ?? "http://127.0.0.1:8545";

// 定义本地 Anvil 链配置
export const localAnvil = {
  ...anvil,
  rpcUrls: {
    default: { http: [anvilRpcUrl] },
    public: { http: [anvilRpcUrl] },
  },
};

export const SUPPORTED_CHAINS = [
  localAnvil,
  mainnet,
  arbitrum,
  optimism,
  // polygon,
];

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export const CHAIN_ID_TO_RPC: Record<number, string> = {
  [localAnvil.id]: anvilRpcUrl,
  [mainnet.id]: "https://mainnet.infura.io/v3/329b3141ddff4730b2525b4669a9235b",
  [arbitrum.id]: "https://arb1.arbitrum.io/rpc",
  [optimism.id]: "https://mainnet.optimism.io",
  [polygon.id]: "https://polygon-rpc.com",
};
