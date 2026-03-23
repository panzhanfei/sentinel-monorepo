import type { Transaction } from "@/types/audit";
import { formatWeiToEth, truncateHash } from "@/utils/format";

interface FootprintTableProps {
  txList?: Transaction[];
  isLoading: boolean;
  hasWallet: boolean;
}

export function FootprintTable({
  txList,
  isLoading,
  hasWallet,
}: FootprintTableProps) {
  const rows = txList ?? [];
  const showEmpty = hasWallet && !isLoading && rows.length === 0;

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

      <div className="flex-1 overflow-auto p-4">
        {!hasWallet ? (
          <p className="px-8 py-10 text-xs text-zinc-500 text-center">
            Connect a wallet in the host app to load on-chain footprint.
          </p>
        ) : showEmpty ? (
          <p className="px-8 py-10 text-xs text-zinc-500 text-center">
            No recent transactions found for this address.
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-950/40 z-10">
              <tr className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">TX_Hash</th>
                <th className="px-8 py-5 text-center">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((tx) => (
                <tr
                  key={tx.hash}
                  className="hover:bg-indigo-500/5 transition-all group cursor-crosshair"
                >
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs text-zinc-400 group-hover:text-indigo-400 transition-colors">
                      {truncateHash(tx.hash)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-black text-zinc-200">
                      {formatWeiToEth(tx.value)}{" "}
                      <span className="text-zinc-600">ETH</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
