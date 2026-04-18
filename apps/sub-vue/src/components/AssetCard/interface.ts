import type { ChainBalance, TokenBalance } from "@/types/monitor";

export interface IAssetCardProps {
  record: ChainBalance | TokenBalance;
  isRemovable?: boolean;
  className?: string;
}
