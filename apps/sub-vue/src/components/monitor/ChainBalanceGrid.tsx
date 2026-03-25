import { defineComponent, type PropType } from "vue";
import type { ChainBalance } from "@/types/monitor";
import ChainStatCard from "./ChainStatCard";

export default defineComponent({
  name: "ChainBalanceGrid",
  props: {
    chains: { type: Array as PropType<readonly ChainBalance[]>, required: true },
  },
  setup(props) {
    return () => (
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {props.chains.map((chain) => (
          <ChainStatCard key={chain.chainId} chain={chain} />
        ))}
      </div>
    );
  },
});
