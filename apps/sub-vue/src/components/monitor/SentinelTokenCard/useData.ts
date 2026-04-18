import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { ISentinelTokenCardEmits, ISentinelTokenCardProps } from "./interface";

type SentinelTokenCardEmitsValidators = {
  [K in keyof ISentinelTokenCardEmits]: (...args: ISentinelTokenCardEmits[K]) => boolean;
};

const sentinelTokenCardPropsOptions: ComponentObjectPropsOptions<ISentinelTokenCardProps> =
  {
    token: { type: Object as PropType<ISentinelTokenCardProps["token"]>, required: true },
  };

const sentinelTokenCardEmitsOptions: SentinelTokenCardEmitsValidators = {
  remove: (_id: string) => true,
};

export const useSentinelTokenCardData = () => {
  return {
    props: sentinelTokenCardPropsOptions,
    emits: sentinelTokenCardEmitsOptions,
  };
}
