import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { ISentinelTokenGridEmits, ISentinelTokenGridProps } from "./interface";

type SentinelTokenGridEmitsValidators = {
  [K in keyof ISentinelTokenGridEmits]: (...args: ISentinelTokenGridEmits[K]) => boolean;
};

const sentinelTokenGridPropsOptions: ComponentObjectPropsOptions<ISentinelTokenGridProps> =
  {
    tokens: { type: Array as PropType<ISentinelTokenGridProps["tokens"]>, required: true },
  };

const sentinelTokenGridEmitsOptions: SentinelTokenGridEmitsValidators = {
  remove: (_id: string) => true,
};

export const useSentinelTokenGridData = () => {
  return {
    props: sentinelTokenGridPropsOptions,
    emits: sentinelTokenGridEmitsOptions,
  };
}
