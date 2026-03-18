// 文件路径: @/views/MonitorDashboard.tsx
import { defineComponent, ref } from "vue";
import { useScanner } from "@/composables/useScanner";
import { useMonitorCharts } from "@/composables/useMonitorCharts";
import { EChartsSection } from "./components/EChartsSection";

export default defineComponent({
  setup() {
    const {
      address,
      chainBalances,
      customTokens,
      addToken,
      removeToken,
      filteredTokens,
    } = useScanner();
    const { distributionData, trendData } = useMonitorCharts(
      chainBalances,
      customTokens,
    );
    const inputAddr = ref("");

    return () => (
      <div class="min-h-screen  text-zinc-100 p-8 font-mono">
        {!address.value && (
          <div class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-4xl">
            <div class="text-zinc-600 font-mono text-xs animate-pulse">
              WAITING_FOR_WALLET_CONNECTION...
            </div>
          </div>
        )}
        {/* V-1: 区块高度卡片 */}
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {chainBalances.value.map((chain) => (
            <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-4xl hover:border-indigo-500/30 transition-all">
              <div class="text-[10px] text-zinc-500 mb-2 uppercase tracking-widest">
                {chain.chainName}
              </div>
              <div class="text-2xl font-black text-white">
                {chain.height.toLocaleString()}
              </div>
              <div class="text-xs text-indigo-400 mt-2">
                {chain.balance} {chain.symbol}
              </div>
            </div>
          ))}
        </div>

        {/*  图表区 */}
        <EChartsSection
          distributionData={distributionData.value}
          trendData={trendData.value}
        />

        {/*  哨兵注册 (真实合约扫描) */}
        <div class="mt-10 bg-linear-to-br from-zinc-900 to-black border border-white/5 p-8 rounded-[3rem]">
          <h3 class="text-lg font-bold mb-6 flex items-center gap-3">
            <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Sentinel_Agent_Deployer
          </h3>
          <div class="flex gap-4">
            <input
              v-model={inputAddr.value}
              placeholder="0x... (ERC-20 Contract Address)"
              class="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
            />
            <button
              onClick={() => {
                addToken(inputAddr.value);
                inputAddr.value = "";
              }}
              class="bg-indigo-600 hover:bg-indigo-500 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              Scan_&_Deploy
            </button>
          </div>

          {/* 实时代币列表 */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredTokens.value.map((token) => (
              <div class="group relative p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all overflow-hidden">
                <div class="absolute top-3 right-3 px-2 py-0.5 bg-white/10 rounded text-[8px] font-bold text-zinc-400 uppercase tracking-tighter border border-white/5">
                  {token.chainName}
                </div>

                <div class="flex justify-between items-start mb-4">
                  <div>
                    <div class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                      {token.symbol}
                    </div>
                    <div class="text-sm font-black text-white mt-1">
                      {parseFloat(token.balance).toLocaleString()}
                    </div>
                  </div>

                  {/* 红框位置：删除按钮 (Delete Button) */}
                  <button
                    onClick={() => removeToken(token.id)}
                    class="opacity-0 group-hover:opacity-100 transition-all p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl border border-rose-500/20"
                    title="Terminate Monitor"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div class="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div class="text-[9px] font-mono text-zinc-600 truncate w-40">
                    {token.address}
                  </div>
                  <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-[8px] text-emerald-500 font-bold uppercase">
                      Live
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* 无数据时的占位 */}
            {filteredTokens.value.length === 0 && (
              <div class="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-zinc-700">
                <p class="text-[10px] font-bold uppercase tracking-[0.2em]">
                  No_Sentinel_Active_In_This_Sector
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
});
