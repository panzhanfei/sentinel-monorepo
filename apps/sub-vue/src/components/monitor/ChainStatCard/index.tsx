import { defineComponent } from "vue";
import type { IProps } from "./interface";
import { useChainStatCardData } from "./useData";

export default defineComponent({
  name: "ChainStatCard",
  ...useChainStatCardData(),
  setup: (props: IProps) => {
      return () => (
        <div class="bg-zinc-900/50 border border-white/5 p-6 rounded-4xl hover:border-indigo-500/30 transition-all">
          <div class="text-[10px] text-zinc-500 mb-2 uppercase tracking-widest">
            {props.chain.chainName}
          </div>
          <div class="text-2xl font-black text-white">
            {props.chain.height.toLocaleString()}
          </div>
          <div class="text-xs text-indigo-400 mt-2">
            {props.chain.balance} {props.chain.symbol}
          </div>
        </div>
      );
    },
});
