import type { TokenBalance } from "@/types/monitor";

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
