import { ref } from "vue";
import type { Address } from "viem";
import { useMonitorStore, useWeb3Store } from "@/stores";
import { scanErc20AcrossChains } from "@/services";
import { viemManager } from "@/utils";

export const useTokenManagerData = () => {
  const monitorStore = useMonitorStore();
  const web3 = useWeb3Store();
  const inputAddr = ref("");

  const addToken = async () => {
    const addr = web3.web3Date?.address as Address | undefined;
    if (!addr) return;
    const found = await scanErc20AcrossChains(
      inputAddr.value,
      addr,
      (id) => viemManager.getClient(id),
    );
    monitorStore.mergeScannedTokens(found);
    inputAddr.value = "";
  };

  return { monitorStore, inputAddr, addToken };
}
