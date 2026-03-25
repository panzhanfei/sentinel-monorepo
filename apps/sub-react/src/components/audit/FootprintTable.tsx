import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Transaction } from "@/types/audit";
import { formatWeiToEth, truncateHash } from "@/utils/format";

interface FootprintTableProps {
  txList?: Transaction[];
  isLoading: boolean;
  hasWallet: boolean;
}

const ROW_H = 56;

export function FootprintTable({
  txList,
  isLoading,
  hasWallet,
}: FootprintTableProps) {
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

  return (
    <section className="bg-zinc-950/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 overflow-hidden h-150 flex flex-col">
      <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/2 shrink-0">
        <h3 className="font-black text-white italic tracking-widest uppercase text-sm">
          Footprint_Scanner
        </h3>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div ref={parentRef} className="flex-1 min-h-0 overflow-auto p-4">
        {!hasWallet ? (
          <p className="px-8 py-10 text-xs text-zinc-500 text-center">
            Connect a wallet in the host app to load on-chain footprint.
          </p>
        ) : showEmpty ? (
          <p className="px-8 py-10 text-xs text-zinc-500 text-center">
            No recent transactions found for this address.
          </p>
        ) : (
          <div className="w-full">
            <div className="sticky top-0 z-10 flex text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] bg-zinc-950/90 backdrop-blur-sm border-b border-white/5">
              <div className="flex-1 px-8 py-5">TX_Hash</div>
              <div className="w-44 shrink-0 px-4 py-5 text-center">Value</div>
            </div>
            <div
              className="relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {vItems.map((vi) => {
                const tx = rows[vi.index];
                if (!tx) return null;
                return (
                  <div
                    key={tx.hash}
                    className="absolute top-0 left-0 w-full flex items-stretch border-b border-white/5 hover:bg-indigo-500/5 transition-all group cursor-crosshair"
                    style={{
                      height: ROW_H,
                      transform: `translateY(${vi.start}px)`,
                    }}
                  >
                    <div className="flex-1 px-8 py-4 flex items-center min-w-0">
                      <span className="font-mono text-xs text-zinc-400 group-hover:text-indigo-400 transition-colors truncate">
                        {truncateHash(tx.hash)}
                      </span>
                    </div>
                    <div className="w-44 shrink-0 px-4 py-4 flex items-center justify-center">
                      <span className="text-xs font-black text-zinc-200">
                        {formatWeiToEth(tx.value)}{" "}
                        <span className="text-zinc-600">ETH</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
