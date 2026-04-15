import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { IEmits, IProps } from "./interface";

type IEmitsValidators = {
  [K in keyof IEmits]: (...args: IEmits[K]) => boolean;
};

const sentinelTokenGridPropsOptions: ComponentObjectPropsOptions<IProps> =
  {
    tokens: { type: Array as PropType<IProps["tokens"]>, required: true },
  };

const sentinelTokenGridEmitsOptions: IEmitsValidators = {
  remove: (_id: string) => true,
};

export const useSentinelTokenGridData = () => {
  return {
    props: sentinelTokenGridPropsOptions,
    emits: sentinelTokenGridEmitsOptions,
  };
}
