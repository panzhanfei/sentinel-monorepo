import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { IEmits, IProps } from "./interface";

type IEmitsValidators = {
  [K in keyof IEmits]: (...args: IEmits[K]) => boolean;
};

const sentinelTokenCardPropsOptions: ComponentObjectPropsOptions<IProps> =
  {
    token: { type: Object as PropType<IProps["token"]>, required: true },
  };

const sentinelTokenCardEmitsOptions: IEmitsValidators = {
  remove: (_id: string) => true,
};

export const useSentinelTokenCardData = () => {
  return {
    props: sentinelTokenCardPropsOptions,
    emits: sentinelTokenCardEmitsOptions,
  };
}
