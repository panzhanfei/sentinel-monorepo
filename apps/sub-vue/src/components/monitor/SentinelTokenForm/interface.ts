export interface ISentinelTokenFormProps {
  modelValue: string;
  disabled?: boolean;
}

export type ISentinelTokenFormEmits = {
  "update:modelValue": [value: string];
  submit: [];
};
