import type { PublicClient } from "viem";
import { getAddress } from "viem";
import type { Transaction } from "@/types/audit";

/**
 * 从当前 publicClient 所连链上扫描最近区块，收集与地址相关的交易（适合本地 Anvil）。
 * 返回格式与原先 Etherscan txlist 一致：hash + value（wei 字符串），表格无需改动。
 */
export async function fetchFootprintTransactions(
  client: PublicClient,
  address: string,
  opts?: { maxBlocks?: number; limit?: number },
): Promise<Transaction[]> {
  const maxBlocks = opts?.maxBlocks ?? 300;
  const limit = opts?.limit ?? 10;
  const addr = getAddress(address);

  const latest = await client.getBlockNumber();
  const out: Transaction[] = [];

  for (let i = 0n; i < BigInt(maxBlocks) && out.length < limit; i++) {
    const n = latest - i;
    if (n < 0n) break;

    const block = await client.getBlock({
      blockNumber: n,
      includeTransactions: true,
    });
    if (!block.transactions?.length) continue;

    for (const tx of block.transactions) {
      if (typeof tx === "string") continue;
      const fromMatch =
        tx.from?.toLowerCase() === addr.toLowerCase();
      const toMatch =
        tx.to != null && tx.to.toLowerCase() === addr.toLowerCase();
      if (!fromMatch && !toMatch) continue;

      out.push({ hash: tx.hash, value: tx.value.toString() });
      if (out.length >= limit) break;
    }
  }

  return out;
}
