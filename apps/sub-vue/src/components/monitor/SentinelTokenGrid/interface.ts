import type { TokenBalance } from "@/types/monitor";

export interface IProps {
  tokens: readonly TokenBalance[];
}

export type IEmits = {
  remove: [id: string];
};
