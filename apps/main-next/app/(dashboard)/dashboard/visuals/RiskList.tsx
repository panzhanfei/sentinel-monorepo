"use client";
import { useState } from "react";
import { AllowanceAudit } from "../hooks/types";
import { Address } from "viem";
import { ShieldX, Target } from "lucide-react";

interface Props {
  allowances: AllowanceAudit[];
  onRevoke: (token: Address, spender: Address) => Promise<unknown> | void;
}

export function RiskList({ allowances, onRevoke }: Props) {
  const [pendingRevokeKey, setPendingRevokeKey] = useState<string | null>(null);

  const getRevokeKey = (token: Address, spender: Address) =>
    `${token.toLowerCase()}-${spender.toLowerCase()}`;

  const handleClick = async (token: Address, spender: Address) => {
    const key = getRevokeKey(token, spender);
    if (pendingRevokeKey === key) return;
    setPendingRevokeKey(key);
    try {
      await Promise.resolve(onRevoke(token, spender));
    } finally {
      setPendingRevokeKey((current) => (current === key ? null : current));
    }
  };

  if (allowances.length === 0) {
    return (
      <div className="py-12 text-center bg-emerald-500/5 rounded-3xl border border-dashed border-emerald-500/20 animate-in zoom-in duration-500">
        <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <Target className="text-emerald-500 w-6 h-6" />
        </div>
        <p className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-[0.3em]">
          Zero Threat Exposures Detected
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allowances.map((item, idx) => (
        <div
          key={idx}
          className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all duration-300 group flex items-center justify-between"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
              <ShieldX size={20} strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-white tracking-tight uppercase">
                  {item.tokenSymbol}
                </span>
                <span className="text-[9px] font-mono text-slate-500 truncate">
                  Spender: {item.spenderName}
                </span>
              </div>
              <p className="text-[9px] font-mono text-slate-600 truncate uppercase tracking-tighter">
                Target: {item.spenderAddress}
              </p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-2 ml-4">
            <div className="text-sm font-mono font-bold text-slate-200">
              {parseFloat(item.allowance) > 1000000
                ? "UNLIMITED_MAX"
                : parseFloat(item.allowance).toLocaleString()}
            </div>
            <button
              onClick={() =>
                handleClick(
                  item.tokenAddress as Address,
                  item.spenderAddress as Address,
                )
              }
              disabled={
                pendingRevokeKey ===
                getRevokeKey(
                  item.tokenAddress as Address,
                  item.spenderAddress as Address,
                )
              }
              className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer tracking-widest uppercase disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingRevokeKey ===
              getRevokeKey(
                item.tokenAddress as Address,
                item.spenderAddress as Address,
              )
                ? "REVOKING..."
                : "REVOKE_ACCESS"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
