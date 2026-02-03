import { ref, watch, onMounted, onUnmounted } from "vue";
import { formatEther, formatUnits, isAddress } from "viem";
import { viemManager } from "@/utils/viemClients";
import { useWeb3Store } from "@/stores";
import { SUPPORTED_CHAINS } from "@/constants/chains";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "symbol", type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "decimals", type: "uint8" }],
  },
] as const;

// 基础资产接口
export interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: string;
  symbol: string;
  loading: boolean;
  isError: boolean;
}

// 扩展：代币资产接口（无 any）
export interface TokenBalance extends ChainBalance {
  tokenAddress: `0x${string}`;
  id: string; // 唯一标识：chainId-tokenAddress
}

export function useScanner() {
  const web3Store = useWeb3Store();

  // 核心响应式数据
  const balances = ref<ChainBalance[]>(
    SUPPORTED_CHAINS.map((c) => ({
      chainId: c.id,
      chainName: c.name,
      balance: "0.00",
      symbol: c.nativeCurrency.symbol,
      loading: false,
      isError: false,
    })),
  );

  const customTokens = ref<TokenBalance[]>([]);

  // 缓存 Key 管理
  const getCacheKey = () =>
    `SENTINEL_CUSTOM_ADDRS_${web3Store.web3Date?.address}`;

  let currentVersion = 0;

  /**
   * 1. 原生代币全链扫描
   */
  const scanAll = async (address: `0x${string}`) => {
    const version = ++currentVersion;
    const tasks = SUPPORTED_CHAINS.map(async (chain) => {
      const target = balances.value.find((b) => b.chainId === chain.id);
      if (target) {
        target.loading = true;
        target.isError = false;
      }

      try {
        const client = viemManager.getClient(chain.id);
        if (!client) return;

        const rawBalance = await client.getBalance({ address });
        if (version !== currentVersion) return;

        if (target) {
          target.balance = Number(formatEther(rawBalance)).toFixed(4);
        }
      } catch (err) {
        console.error(`${chain.name} 原生余额扫描失败`, err);
        if (target) target.isError = true;
      } finally {
        if (target) target.loading = false;
      }
    });

    await Promise.all(tasks);
  };

  /**
   * 2. 添加并扫描自定义 ERC20 代币
   */
  const addToken = async (tokenAddr: string) => {
    if (!isAddress(tokenAddr)) return alert("无效地址");
    const userAddr = web3Store.web3Date?.address as `0x${string}`;
    if (!userAddr) return;

    const tasks = SUPPORTED_CHAINS.map(async (chain) => {
      try {
        const client = viemManager.getClient(chain.id);
        if (!client) return;

        // 并发读取合约数据
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
            args: [userAddr],
          }),
        ]);

        const newToken: TokenBalance = {
          id: `${chain.id}-${tokenAddr}`,
          chainId: chain.id,
          chainName: chain.name,
          symbol,
          tokenAddress: tokenAddr,
          balance: formatUnits(balance, decimals),
          loading: false,
          isError: false,
        };

        // 更新或追加 (去重)
        const idx = customTokens.value.findIndex((t) => t.id === newToken.id);
        if (idx > -1) customTokens.value[idx] = newToken;
        else customTokens.value.push(newToken);
      } catch (e) {
        console.warn(`${chain.name} 上未找到合约: ${tokenAddr}`);
      }
    });

    await Promise.all(tasks);
    // 存入缓存清单
    saveCacheList(tokenAddr);
  };

  const saveCacheList = (addr: string) => {
    const key = getCacheKey();
    const list: string[] = JSON.parse(sessionStorage.getItem(key) || "[]");
    if (!list.includes(addr)) {
      list.push(addr);
      sessionStorage.setItem(key, JSON.stringify(list));
    }
  };

  /**
   * 3. 实时区块监听
   */
  let unwatch: (() => void) | null = null;
  const startWatching = () => {
    const client = viemManager.getClient(1);
    if (!client) return;
    unwatch = client.watchBlockNumber({
      onBlockNumber: (blockNumber) => {
        console.log(`[哨兵] 新区块: ${blockNumber}，全链刷新...`);
        if (web3Store.web3Date?.address) {
          scanAll(web3Store.web3Date.address as `0x${string}`);
          // 静默刷新所有已监控的代币
          const key = getCacheKey();
          const list: string[] = JSON.parse(
            sessionStorage.getItem(key) || "[]",
          );
          list.forEach((addr) => addToken(addr));
        }
      },
    });
  };

  onMounted(() => startWatching());
  onUnmounted(() => unwatch?.());

  watch(
    () => web3Store.web3Date?.address,
    (newAddr) => {
      if (newAddr) {
        scanAll(newAddr as `0x${string}`);
        // 切换地址时加载对应的缓存代币
        customTokens.value = [];
        const key = getCacheKey();
        const list: string[] = JSON.parse(sessionStorage.getItem(key) || "[]");
        list.forEach((addr) => addToken(addr));
      }
    },
    { immediate: true },
  );

  return { balances, addToken, customTokens };
}
