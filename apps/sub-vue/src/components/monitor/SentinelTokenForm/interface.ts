export interface IProps {
  modelValue: string;
  disabled?: boolean;
}

export type IEmits = {
  "update:modelValue": [value: string];
  submit: [];
};
