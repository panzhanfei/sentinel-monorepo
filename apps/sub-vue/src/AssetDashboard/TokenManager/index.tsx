import { defineComponent, ref } from "vue";
import { useScanner } from "@/composables/useScanner";
import { AssetCard } from "@/components";

export const TokenManager = defineComponent({
  setup() {
    const { addToken, customTokens } = useScanner();
    const inputAddr = ref("");

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
            onClick={() => addToken(inputAddr.value)}
            class="bg-blue-600 text-white px-4 py-2 rounded"
          >
            添加监控
          </button>
        </div>

        {/* 动态渲染用户添加的代币 */}
        <div class="grid grid-cols-2 gap-4">
          {customTokens.value.map((token) => (
            <AssetCard record={token} isRemovable={true} />
          ))}
        </div>
      </div>
    );
  },
});
