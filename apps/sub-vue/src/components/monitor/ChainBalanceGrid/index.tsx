import { defineComponent } from "vue";
import ChainStatCard from "../ChainStatCard";
import type { IChainBalanceGridProps } from "./interface";
import { useChainBalanceGridData } from "./useData";

export default defineComponent({
  name: "ChainBalanceGrid",
  ...useChainBalanceGridData(),
  setup: (props: IChainBalanceGridProps) => {
      return () => (
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {props.chains.map((chain) => (
            <ChainStatCard key={chain.chainId} chain={chain} />
          ))}
        </div>
      );
    },
});
