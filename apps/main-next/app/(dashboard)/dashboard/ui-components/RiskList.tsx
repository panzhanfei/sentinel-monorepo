import { AllowanceAudit } from "../hooks/types";
import { Address } from "viem";

interface Props {
  allowances: AllowanceAudit[];
  onRevoke: (token: Address, spender: Address) => void;
}

export function RiskList({ allowances, onRevoke }: Props) {
  if (allowances.length === 0) {
    return (
      <div className="py-8 text-center bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/20">
        <p className="text-[10px] font-bold text-emerald-500 uppercase">
          System Secured
        </p>
      </div>
    );
  }

  return (
    <>
      {allowances.map((item, idx) => (
        <div
          key={idx}
          className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-rose-500/20 transition-all group"
        >
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black text-rose-400 px-1.5 py-0.5 bg-rose-500/10 rounded tracking-tighter uppercase">
                  {item.tokenSymbol}
                </span>
                <span className="text-[10px] text-slate-400 truncate font-bold">
                  via {item.spenderName}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-black text-slate-200">
                {parseFloat(item.allowance) > 1000000
                  ? "∞"
                  : parseFloat(item.allowance).toLocaleString()}
              </p>
              <button
                onClick={() =>
                  onRevoke(
                    item.tokenAddress as Address,
                    item.spenderAddress as Address,
                  )
                }
                className="text-[9px] font-black text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-300 hover:underline cursor-pointer"
              >
                REVOKE
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
