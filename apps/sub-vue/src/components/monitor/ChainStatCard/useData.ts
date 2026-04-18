import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { IChainStatCardProps } from "./interface";

const chainStatCardPropsOptions: ComponentObjectPropsOptions<IChainStatCardProps> = {
  chain: { type: Object as PropType<IChainStatCardProps["chain"]>, required: true },
};

export const useChainStatCardData = () => {
  return { props: chainStatCardPropsOptions };
}
