import type { ChainBalance, TokenBalance } from "@/types/monitor";

export interface AssetCardProps {
  record: ChainBalance | TokenBalance;
  isRemovable?: boolean;
  className?: string;
}
