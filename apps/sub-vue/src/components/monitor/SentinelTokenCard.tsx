import { defineComponent, type PropType } from "vue";
import type { TokenBalance } from "@/types/monitor";

export default defineComponent({
  name: "SentinelTokenCard",
  props: {
    token: { type: Object as PropType<TokenBalance>, required: true },
  },
  emits: ["remove"],
  setup(props, { emit }) {
    return () => (
      <div class="group relative p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all overflow-hidden">
        <div class="absolute top-3 right-3 px-2 py-0.5 bg-white/10 rounded text-[8px] font-bold text-zinc-400 uppercase tracking-tighter border border-white/5">
          {props.token.chainName}
        </div>

        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              {props.token.symbol}
            </div>
            <div class="text-sm font-black text-white mt-1">
              {parseFloat(props.token.balance).toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => emit("remove", props.token.id)}
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
            {props.token.address}
          </div>
          <div class="flex gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[8px] text-emerald-500 font-bold uppercase">
              Live
            </span>
          </div>
        </div>
      </div>
    );
  },
});
