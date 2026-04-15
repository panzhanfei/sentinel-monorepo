import type { ComponentObjectPropsOptions } from "vue";
import type { IEmits, IProps } from "./interface";

type IEmitsValidators = {
  [K in keyof IEmits]: (...args: IEmits[K]) => boolean;
};

const sentinelTokenFormPropsOptions: ComponentObjectPropsOptions<IProps> =
  {
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  };

const sentinelTokenFormEmitsOptions: IEmitsValidators = {
  "update:modelValue": (_value: string) => true,
  submit: () => true,
};

export const useSentinelTokenFormData = () => {
  return {
    props: sentinelTokenFormPropsOptions,
    emits: sentinelTokenFormEmitsOptions,
  };
}
