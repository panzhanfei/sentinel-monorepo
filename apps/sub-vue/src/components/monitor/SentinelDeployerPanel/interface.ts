import type { TokenBalance } from "@/types";

export interface ISentinelDeployerPanelProps {
  modelValue: string;
  tokens: readonly TokenBalance[];
  formDisabled?: boolean;
}

export type ISentinelDeployerPanelEmits = {
  "update:modelValue": [value: string];
  submit: [];
  remove: [id: string];
};
