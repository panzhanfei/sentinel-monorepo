import type { Transaction } from "@/types/audit";

export interface FootprintTableProps {
  txList?: Transaction[];
  isLoading: boolean;
  hasWallet: boolean;
}
