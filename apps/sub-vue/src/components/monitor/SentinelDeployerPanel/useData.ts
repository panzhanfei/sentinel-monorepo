import type { ComponentObjectPropsOptions, PropType } from "vue";
import type {
  ISentinelDeployerPanelEmits,
  ISentinelDeployerPanelProps,
} from "./interface";

type SentinelDeployerPanelEmitsValidators = {
  [K in keyof ISentinelDeployerPanelEmits]: (
    ...args: ISentinelDeployerPanelEmits[K]
  ) => boolean;
};

const sentinelDeployerPanelPropsOptions: ComponentObjectPropsOptions<ISentinelDeployerPanelProps> =
  {
    modelValue: { type: String, required: true },
    tokens: {
      type: Array as PropType<ISentinelDeployerPanelProps["tokens"]>,
      required: true,
    },
    formDisabled: { type: Boolean, default: false },
  };

const sentinelDeployerPanelEmitsOptions: SentinelDeployerPanelEmitsValidators =
  {
    "update:modelValue": (_value: string) => true,
    submit: () => true,
    remove: (_id: string) => true,
  };

export const useSentinelDeployerPanelData = () => {
  return {
    props: sentinelDeployerPanelPropsOptions,
    emits: sentinelDeployerPanelEmitsOptions,
  };
};
