import type { ComponentObjectPropsOptions, PropType } from "vue";
import type { IEmits, IProps } from "./interface";

type IEmitsValidators = {
  [K in keyof IEmits]: (...args: IEmits[K]) => boolean;
};

const sentinelDeployerPanelPropsOptions: ComponentObjectPropsOptions<IProps> =
  {
    modelValue: { type: String, required: true },
    tokens: {
      type: Array as PropType<IProps["tokens"]>,
      required: true,
    },
    formDisabled: { type: Boolean, default: false },
  };

const sentinelDeployerPanelEmitsOptions: IEmitsValidators = {
  "update:modelValue": (_value: string) => true,
  submit: () => true,
  remove: (_id: string) => true,
};

export const useSentinelDeployerPanelData = () => {
  return {
    props: sentinelDeployerPanelPropsOptions,
    emits: sentinelDeployerPanelEmitsOptions,
  };
}
