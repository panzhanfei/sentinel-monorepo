import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { IProps } from "./interface";

const chainStatCardPropsOptions: ComponentObjectPropsOptions<IProps> = {
  chain: { type: Object as PropType<IProps["chain"]>, required: true },
};

export const useChainStatCardData = () => {
  return { props: chainStatCardPropsOptions };
}
