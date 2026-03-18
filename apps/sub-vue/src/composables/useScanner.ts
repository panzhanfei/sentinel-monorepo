// 文件路径: @/composables/useScanner.ts
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { formatEther, formatUnits, isAddress, type Address } from "viem";
import { viemManager } from "@/utils/viemClients";
import { useWeb3Store } from "@/stores";
import { SUPPORTED_CHAINS } from "@/constants/chains";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "symbol",
    type: "function",
    inputs: [],
    outputs: [{ name: "symbol", type: "string" }],
    stateMutability: "view",
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "decimals", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

export interface TokenBalance {
  id: string; // 唯一标识: chainId-address
  chainId: number;
  chainName: string;
  address: string;
  symbol: string;
  balance: string;
  loading: boolean;
}

export function useScanner() {
  const web3Store = useWeb3Store();
  const address = computed(() => web3Store.web3Date?.address as Address);

  // 1. 原生资产状态 (ETH/MATIC 等)
  const chainBalances = ref(
    SUPPORTED_CHAINS.map((c) => ({
      chainId: c.id,
      chainName: c.name,
      balance: "0.00",
      symbol: c.nativeCurrency?.symbol || "ETH",
      height: 0,
      loading: false,
    })),
  );

  // 2. 自定义代币状态 (ERC-20)
  const customTokens = ref<TokenBalance[]>([]);

  // 3. 扫描原生余额与区块高度 (V-1 核心)
  const refreshBaseData = async () => {
    if (!address.value) return;

    await Promise.all(
      chainBalances.value.map(async (item) => {
        const client = viemManager.getClient(item.chainId);
        if (!client) return;
        item.loading = true;
        try {
          const [bal, height] = await Promise.all([
            client.getBalance({ address: address.value! }),
            client.getBlockNumber(),
          ]);
          item.balance = parseFloat(formatEther(bal)).toFixed(4);
          item.height = Number(height);
        } catch (e) {
          console.warn(`Fetch failed for ${item.chainName}`, e);
        } finally {
          item.loading = false;
        }
      }),
    );
  };

  /**
   * 4. 扫描自定义 ERC-20 (全链循环扫描 + 去重)
   */
  const addToken = async (tokenAddr: string) => {
    if (!isAddress(tokenAddr) || !address.value) return;

    // 遍历所有支持的链进行扫描
    const tasks = SUPPORTED_CHAINS.map(async (chain) => {
      const client = viemManager.getClient(chain.id);
      if (!client) return;

      const tokenId = `${chain.id}-${tokenAddr.toLowerCase()}`;

      try {
        // 并行获取代币信息
        const [symbol, decimals, balance] = await Promise.all([
          client.readContract({
            address: tokenAddr as Address,
            abi: ERC20_ABI,
            functionName: "symbol",
          }),
          client.readContract({
            address: tokenAddr as Address,
            abi: ERC20_ABI,
            functionName: "decimals",
          }),
          client.readContract({
            address: tokenAddr as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address.value!],
          }),
        ]);

        const newToken: TokenBalance = {
          id: tokenId,
          chainId: chain.id,
          chainName: chain.name,
          address: tokenAddr,
          symbol: symbol as string,
          balance: formatUnits(balance as bigint, decimals as number),
          loading: false,
        };

        // --- 去重逻辑 ---
        const existingIdx = customTokens.value.findIndex(
          (t) => t.id === tokenId,
        );
        if (existingIdx > -1) {
          // 如果已存在，更新数据（比如余额变了）
          customTokens.value[existingIdx] = newToken;
        } else {
          // 不存在则添加
          customTokens.value.push(newToken);
        }
      } catch (e) {
        // 如果某条链上没这个合约，静默跳过即可
        console.log(`Token not found on chain: ${chain.name}`);
      }
    });

    await Promise.all(tasks);
  };

  // 5. 实时监听 (以 Anvil 为主心跳，带动全线刷新)
  let unwatch: any;
  onMounted(() => {
    const client = viemManager.getClient(31337) || viemManager.getClient(1);
    unwatch = client?.watchBlockNumber({
      onBlockNumber: () => {
        refreshBaseData();
        // 同时静默刷新已添加的代币余额
        customTokens.value.forEach((token) => {
          // 这里可以按需实现一个静默更新余额的方法
        });
      },
    });
  });

  onUnmounted(() => unwatch?.());
  const removeToken = (tokenId: string) => {
    customTokens.value = customTokens.value.filter((t) => t.id !== tokenId);
  };

  // 提供一个计算属性用于 UI 过滤（后面 UI 会用到）
  const activeTab = ref<number | "all">("all");
  const filteredTokens = computed(() => {
    if (activeTab.value === "all") return customTokens.value;
    return customTokens.value.filter((t) => t.chainId === activeTab.value);
  });

  // 监听地址切换
  watch(
    address,
    (newAddr) => {
      if (newAddr) {
        customTokens.value = [];
        refreshBaseData();
      }
    },
    { immediate: true },
  );

  return {
    chainBalances,
    customTokens,
    addToken,
    refreshBaseData,
    address,
    removeToken,
    filteredTokens,
  };
}
