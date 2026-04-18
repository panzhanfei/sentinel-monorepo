import type { Transaction } from "@/types/audit";

export interface IFootprintTableProps {
  txList?: Transaction[];
  isLoading: boolean;
  hasWallet: boolean;
}
