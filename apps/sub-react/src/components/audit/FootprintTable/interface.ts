import type { Transaction } from "@/types";

export interface IFootprintTableProps {
  txList?: Transaction[];
  isLoading: boolean;
  hasWallet: boolean;
}
