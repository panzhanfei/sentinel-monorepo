import { createPublicClient, http } from "viem";
import { foundry, mainnet } from "viem/chains";

const useAnvil =
  import.meta.env.VITE_USE_ANVIL === "true" ||
  import.meta.env.VITE_CHAIN_ID === "31337";

const rpcUrl =
  (import.meta.env.VITE_RPC_URL as string | undefined) || undefined;
const anvilRpc = rpcUrl ?? "http://127.0.0.1:8545";

export const publicClient = createPublicClient({
  chain: useAnvil ? foundry : mainnet,
  transport: useAnvil ? http(anvilRpc) : http(rpcUrl),
});
