import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { IChainBalanceGridProps } from "./interface";

const chainBalanceGridPropsOptions: ComponentObjectPropsOptions<IChainBalanceGridProps> = {
  chains: { type: Array as PropType<IChainBalanceGridProps["chains"]>, required: true },
};

export const useChainBalanceGridData = () => {
  return { props: chainBalanceGridPropsOptions };
}
