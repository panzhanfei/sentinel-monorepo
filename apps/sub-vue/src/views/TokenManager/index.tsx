import { defineComponent } from "vue";
import { AssetCard } from "@/components";
import { useTokenManagerData } from "./useData";

export const TokenManager = defineComponent({
  name: "TokenManager",
  setup: () => {
        const { monitorStore, inputAddr, addToken } = useTokenManagerData();

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
