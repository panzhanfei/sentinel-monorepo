import type { TokenBalance } from "@/types/monitor";

export interface ISentinelTokenGridProps {
  tokens: readonly TokenBalance[];
}

export type ISentinelTokenGridEmits = {
  remove: [id: string];
};
