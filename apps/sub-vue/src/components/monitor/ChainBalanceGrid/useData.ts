import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { IProps } from "./interface";

const chainBalanceGridPropsOptions: ComponentObjectPropsOptions<IProps> = {
  chains: { type: Array as PropType<IProps["chains"]>, required: true },
};

export const useChainBalanceGridData = () => {
  return { props: chainBalanceGridPropsOptions };
}
