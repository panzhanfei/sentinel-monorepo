import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import type { Address } from "viem";
import { useWeb3Store, useMonitorStore } from "@/stores";
import { viemManager } from "@/utils";
import {
  refreshAllNativeBalances,
  scanErc20AcrossChains,
} from "@/services";
import { useChartSeries } from "@/hooks";

const useMonitorDashboardCore = () => {
  const web3Store = useWeb3Store();
  const monitorStore = useMonitorStore();

  const address = computed(
    () => web3Store.web3Date?.address as Address | undefined,
  );

  const getClient = (chainId: number) => viemManager.getClient(chainId);

  const refreshBaseData = async () => {
        const addr = address.value;
        if (!addr) return;
        await refreshAllNativeBalances(
          monitorStore.chainBalances,
          addr,
          getClient,
        );
      }

  const addToken = async (tokenAddr: string) => {
        const addr = address.value;
        if (!addr) return;
        const found = await scanErc20AcrossChains(tokenAddr, addr, getClient);
        monitorStore.mergeScannedTokens(found);
      }

  const { distributionData, trendData } = useChartSeries(
    () => monitorStore.chainBalances,
    () => monitorStore.customTokens,
  );

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

export const useMonitorDashboard = () => {
  return useMonitorDashboardCore();
}

export const useMonitorDashboardData = () => {
  const core = useMonitorDashboardCore();
  const inputAddr = ref("");

  const hasWallet = computed(() => Boolean(core.address.value));

  const submitToken = () => {
    void core.addToken(inputAddr.value);
    inputAddr.value = "";
  };

  return {
    ...core,
    inputAddr,
    hasWallet,
    submitToken,
  };
}
