import type { TokenBalance } from "@/types/monitor";

export interface ISentinelTokenCardProps {
  token: TokenBalance;
}

export type ISentinelTokenCardEmits = {
  remove: [id: string];
};
