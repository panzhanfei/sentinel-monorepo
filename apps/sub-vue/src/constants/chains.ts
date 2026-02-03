import { mainnet, arbitrum, optimism, polygon } from "viem/chains";

export const SUPPORTED_CHAINS = [mainnet, arbitrum, optimism, polygon];

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

export const CHAIN_ID_TO_RPC: Record<number, string> = {
  [mainnet.id]: "https://mainnet.infura.io/v3/329b3141ddff4730b2525b4669a9235b",
  [arbitrum.id]: "https://arb1.arbitrum.io/rpc",
  [optimism.id]: "https://mainnet.optimism.io",
  [polygon.id]: "https://polygon-rpc.com",
};
