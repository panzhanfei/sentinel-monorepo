import type { TokenBalance } from "@/types/monitor";

export interface IProps {
  token: TokenBalance;
}

export type IEmits = {
  remove: [id: string];
};
