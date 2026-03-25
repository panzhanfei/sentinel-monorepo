import { formatEther, formatUnits, isAddress, type Address } from "viem";
import type { PublicClient } from "viem";
import { SUPPORTED_CHAINS } from "@/constants/chains";
import { ERC20_ABI } from "@/constants/erc20Abi";
import type { ChainBalance, TokenBalance } from "@/types/monitor";

export type GetClient = (chainId: number) => PublicClient | undefined;

export function createInitialChainBalances(): ChainBalance[] {
  return SUPPORTED_CHAINS.map((c) => ({
    chainId: c.id,
    chainName: c.name,
    balance: "0.00",
    symbol: c.nativeCurrency?.symbol || "ETH",
    height: 0,
    loading: false,
    isError: false,
  }));
}

export async function refreshChainBalanceRow(
  item: ChainBalance,
  address: Address,
  getClient: GetClient,
): Promise<void> {
  const client = getClient(item.chainId);
  if (!client) return;
  item.loading = true;
  try {
    const [bal, height] = await Promise.all([
      client.getBalance({ address }),
      client.getBlockNumber(),
    ]);
    item.balance = parseFloat(formatEther(bal)).toFixed(4);
    item.height = Number(height);
    item.isError = false;
  } catch (e) {
    item.isError = true;
    console.warn(`Fetch failed for ${item.chainName}`, e);
  } finally {
    item.loading = false;
  }
}

export async function refreshAllNativeBalances(
  rows: ChainBalance[],
  address: Address,
  getClient: GetClient,
): Promise<void> {
  await Promise.all(
    rows.map((item) => refreshChainBalanceRow(item, address, getClient)),
  );
}

export async function fetchErc20OnChain(
  chainId: number,
  chainName: string,
  tokenAddr: Address,
  userAddress: Address,
  getClient: GetClient,
): Promise<TokenBalance | null> {
  const client = getClient(chainId);
  if (!client) return null;

  const tokenId = `${chainId}-${tokenAddr.toLowerCase()}`;

  try {
    const [symbol, decimals, balance] = await Promise.all([
      client.readContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
      client.readContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
      client.readContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }),
    ]);

    return {
      id: tokenId,
      chainId,
      chainName,
      address: tokenAddr,
      symbol: symbol as string,
      balance: formatUnits(balance as bigint, decimals as number),
      loading: false,
    };
  } catch {
    return null;
  }
}

/** 全链扫描同一合约地址，返回在各链上解析成功的代币行 */
export async function scanErc20AcrossChains(
  tokenAddr: string,
  userAddress: Address,
  getClient: GetClient,
): Promise<TokenBalance[]> {
  if (!isAddress(tokenAddr)) return [];

  const addr = tokenAddr as Address;
  const tasks = SUPPORTED_CHAINS.map((chain) =>
    fetchErc20OnChain(chain.id, chain.name, addr, userAddress, getClient),
  );
  const results = await Promise.all(tasks);
  return results.filter((r): r is TokenBalance => r !== null);
}
