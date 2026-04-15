import type { TokenBalance } from "@/types/monitor";

export interface IProps {
  modelValue: string;
  tokens: readonly TokenBalance[];
  formDisabled?: boolean;
}

export type IEmits = {
  "update:modelValue": [value: string];
  submit: [];
  remove: [id: string];
};
