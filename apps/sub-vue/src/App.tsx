import { defineComponent, ref, onMounted } from "vue";
import { viemManager } from "@/utils/viemClients";
import { useScanner } from "@/composables";
import { AssetCard } from "@/components";
import { TokenManager } from "@/AssetDashboard/TokenManager";

export default defineComponent({
  name: "App",
  setup() {
    const blockNumbers = ref<Record<string, string>>({});
    const { balances } = useScanner();

    const fetchHeights = async () => {
      const clients = viemManager.getAllClients();
      for (const [id, client] of clients) {
        client.getBlockNumber().then((num) => {
          blockNumbers.value[id] = num.toString();
        });
      }
    };

    onMounted(fetchHeights);

    return () => (
      <div class="max-w-5xl mx-auto h-screen flex flex-col pb-30">
        <div class="shrink-0 space-y-10">
          <section>
            <h2 class="text-2xl font-black text-gray-900 tracking-tight">
              资产监控中心
            </h2>
            <p class="text-sm text-gray-400 mt-1">跨链实时区块高度与余额探测</p>
          </section>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto space-y-10">
          {/* 链高度状态区 */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(viemManager.getAllClients()).map(([id, client]) => (
              <div
                key={id}
                class="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
              >
                <div class="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">
                  {client.chain?.name}
                </div>
                <div class="text-lg font-mono font-black text-indigo-600">
                  {blockNumbers.value[id] ? (
                    blockNumbers.value[id]
                  ) : (
                    <div class="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 多链资产列表区 */}
          <div class="mt-10">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-bold text-gray-800">
                多链资产分布 (Multi-Chain Assets)
              </h3>
              <span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">
                Live Data
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {balances.value.map((item) => (
                <AssetCard
                  record={item}
                  key={item.chainId}
                  className="hover:border-indigo-100 transition-colors"
                />
              ))}
            </div>
          </div>

          {/* 底部管理区 */}
          <div class="mt-5 ">
            <TokenManager />
          </div>
        </div>
      </div>
    );
  },
});
