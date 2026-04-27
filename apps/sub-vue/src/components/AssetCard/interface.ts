import type { ChainBalance, TokenBalance } from "@/types";

export interface IAssetCardProps {
  record: ChainBalance | TokenBalance;
  isRemovable?: boolean;
  className?: string;
}
