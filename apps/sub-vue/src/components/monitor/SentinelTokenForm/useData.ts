import type { ComponentObjectPropsOptions } from "vue";
import type { ISentinelTokenFormEmits, ISentinelTokenFormProps } from "./interface";

type SentinelTokenFormEmitsValidators = {
  [K in keyof ISentinelTokenFormEmits]: (...args: ISentinelTokenFormEmits[K]) => boolean;
};

const sentinelTokenFormPropsOptions: ComponentObjectPropsOptions<ISentinelTokenFormProps> =
  {
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  };

const sentinelTokenFormEmitsOptions: SentinelTokenFormEmitsValidators = {
  "update:modelValue": (_value: string) => true,
  submit: () => true,
};

export const useSentinelTokenFormData = () => {
  return {
    props: sentinelTokenFormPropsOptions,
    emits: sentinelTokenFormEmitsOptions,
  };
}
