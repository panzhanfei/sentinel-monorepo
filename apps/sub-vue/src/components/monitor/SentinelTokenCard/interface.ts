import type { TokenBalance } from "@/types";

export interface ISentinelTokenCardProps {
  token: TokenBalance;
}

export type ISentinelTokenCardEmits = {
  remove: [id: string];
};
