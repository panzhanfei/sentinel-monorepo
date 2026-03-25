import { defineComponent, ref } from "vue";
import type { Address } from "viem";
import { useMonitorStore } from "@/stores/useMonitorStore";
import { useWeb3Store } from "@/stores/useWeb3Store";
import { scanErc20AcrossChains } from "@/services/monitorChainService";
import { viemManager } from "@/utils/viemClients";
import { AssetCard } from "@/components";

/** 独立入口：只操作 Model + Service，不重复注册区块订阅（由 MonitorDashboard 负责刷新） */
export const TokenManager = defineComponent({
  name: "TokenManager",
  setup() {
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

    return () => (
      <div class="mt-8 border-t pt-6">
        <h3 class="text-lg font-bold mb-4">资产监控哨兵 (ERC-20)</h3>
        <div class="flex gap-2 mb-6">
          <input
            v-model={inputAddr.value}
            placeholder="输入合约地址 0x..."
            class="flex-1 border p-2 rounded"
          />
          <button
            type="button"
            onClick={() => void addToken()}
            class="bg-blue-600 text-white px-4 py-2 rounded"
          >
            添加监控
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4">
          {monitorStore.customTokens.map((token) => (
            <AssetCard key={token.id} record={token} isRemovable={true} />
          ))}
        </div>
      </div>
    );
  },
});
