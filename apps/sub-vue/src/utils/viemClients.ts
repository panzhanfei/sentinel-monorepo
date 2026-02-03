import { SUPPORTED_CHAINS, CHAIN_ID_TO_RPC } from "@/constants";
import { createPublicClient, http, type PublicClient } from "viem";

class ViemClientManager {
  private clients: Map<number, PublicClient> = new Map();

  constructor() {
    SUPPORTED_CHAINS.forEach((chain) => {
      const client = createPublicClient({
        chain,
        transport: http(CHAIN_ID_TO_RPC[chain.id]),
        // 35k 优化：配置缓存和重试
        batch: { multicall: true },
      });
      this.clients.set(chain.id, client as PublicClient);
    });
  }

  public getClient(chainId: number): PublicClient | undefined {
    return this.clients.get(chainId);
  }

  public getAllClients(): Map<number, PublicClient> {
    return this.clients;
  }
}

export const viemManager = new ViemClientManager();
