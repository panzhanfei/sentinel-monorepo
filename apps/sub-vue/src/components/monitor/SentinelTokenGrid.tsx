import { defineComponent, type PropType } from "vue";
import type { TokenBalance } from "@/types/monitor";
import SentinelTokenCard from "./SentinelTokenCard";

export default defineComponent({
  name: "SentinelTokenGrid",
  props: {
    tokens: { type: Array as PropType<readonly TokenBalance[]>, required: true },
  },
  emits: ["remove"],
  setup(props, { emit }) {
    return () => (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {props.tokens.map((token) => (
          <SentinelTokenCard
            key={token.id}
            token={token}
            onRemove={(id: string) => emit("remove", id)}
          />
        ))}

        {props.tokens.length === 0 && (
          <div class="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-zinc-700">
            <p class="text-[10px] font-bold uppercase tracking-[0.2em]">
              No_Sentinel_Active_In_This_Sector
            </p>
          </div>
        )}
      </div>
    );
  },
});
