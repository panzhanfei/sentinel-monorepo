import { computed, watch, onMounted, onUnmounted } from "vue";
import type { Address } from "viem";
import { useWeb3Store, useMonitorStore } from "@/stores";
import { viemManager } from "@/utils/viemClients";
import {
  refreshAllNativeBalances,
  scanErc20AcrossChains,
} from "@/services/monitorChainService";
import {
  buildDistributionSlices,
  buildTrendSeries,
} from "@/models/chartSeries";

/**
 * Controller：连接 Web3 状态、Pinia Model 与链上 Service，
 * 向 View 暴露只读/命令式 API。
 */
export function useMonitorDashboard() {
  const web3Store = useWeb3Store();
  const monitorStore = useMonitorStore();

  const address = computed(
    () => web3Store.web3Date?.address as Address | undefined,
  );

  const getClient = (chainId: number) => viemManager.getClient(chainId);

  async function refreshBaseData() {
    const addr = address.value;
    if (!addr) return;
    await refreshAllNativeBalances(
      monitorStore.chainBalances,
      addr,
      getClient,
    );
  }

  async function addToken(tokenAddr: string) {
    const addr = address.value;
    if (!addr) return;
    const found = await scanErc20AcrossChains(tokenAddr, addr, getClient);
    monitorStore.mergeScannedTokens(found);
  }

  const distributionData = computed(() =>
    buildDistributionSlices(
      monitorStore.chainBalances,
      monitorStore.customTokens,
    ),
  );

  const trendData = computed(() => buildTrendSeries(monitorStore.chainBalances));

  let unwatchBlock: (() => void) | undefined;

  onMounted(() => {
    const client = viemManager.getClient(31337) || viemManager.getClient(1);
    unwatchBlock = client?.watchBlockNumber({
      onBlockNumber: () => {
        void refreshBaseData();
      },
    });
  });

  onUnmounted(() => unwatchBlock?.());

  watch(
    address,
    (newAddr) => {
      if (newAddr) {
        monitorStore.clearCustomTokens();
        void refreshBaseData();
      }
    },
    { immediate: true },
  );

  return {
    address,
    chainBalances: computed(() => monitorStore.chainBalances),
    customTokens: computed(() => monitorStore.customTokens),
    filteredTokens: computed(() => monitorStore.filteredTokens),
    distributionData,
    trendData,
    refreshBaseData,
    addToken,
    removeToken: monitorStore.removeToken,
  };
}
