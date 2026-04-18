import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { IFootprintTableProps } from "./interface";

const ROW_H = 56;

export const useFootprintTableData = ({
  txList,
  isLoading,
  hasWallet,
}: IFootprintTableProps) => {
  const rows = txList ?? [];
  const showEmpty = hasWallet && !isLoading && rows.length === 0;
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
  });

  const vItems = virtualizer.getVirtualItems();

  return {
    rows,
    showEmpty,
    parentRef,
    virtualizer,
    vItems,
    rowHeight: ROW_H,
    isLoading,
    hasWallet,
  };
}
