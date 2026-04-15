"use client";
import { useRef, useEffect } from "react";
import type {
  ScanStatus,
  ScanResultData,
  AgentMessage,
  AllowanceAudit,
} from "../hooks/types";
import { Address } from "viem";
import { AgentLogs } from "./AgentLogs";
import { Terminal, ShieldAlert, Cpu } from "lucide-react";

interface Props {
  scanLoading: boolean;
  scanProgress: number;
  scanStatus: ScanStatus;
  scanResult: ScanResultData | null;
  agentLogs: AgentMessage[];
  riskAllowances: AllowanceAudit[];
  suspiciousCount: number;
  onRevoke: (token: Address, spender: Address) => void;
  onRunScan: () => void;
}

export const AISentinelPanel = ({
  scanLoading,
  scanProgress,
  scanStatus,
  scanResult,
  agentLogs,
  suspiciousCount,
  onRunScan,
}: Props) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [agentLogs, scanResult]);

  const progressBlocks = Math.floor(scanProgress / 6.25);
  const progressBar =
    "█".repeat(progressBlocks) + "░".repeat(16 - progressBlocks);

  return (
    <div className="bg-slate-950/60 backdrop-blur-2xl text-white rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col sticky top-6 h-[720px] overflow-hidden transition-all hover:border-blue-500/20">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${scanLoading ? "bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" : "bg-slate-600"}`}
          />
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-blue-400" />
            <span className="font-mono text-[10px] text-blue-400 uppercase tracking-[0.2em] font-bold">
              AI-Sentinel Terminal
            </span>
          </div>
        </div>
        <span className="text-[9px] font-mono text-slate-600 font-bold tracking-widest">
          OS_V.3.2.0
        </span>
      </div>

      {/* PROGRESS */}
      <div className="px-8 py-5 border-b border-white/5 bg-slate-900/20 font-mono text-[10px] space-y-3">
        {scanLoading ? (
          <>
            <div className="text-slate-400 flex justify-between">
              <span className="animate-pulse">CORE_STREAMS_ACTIVE...</span>
              <span className="text-emerald-400">{scanProgress}%</span>
            </div>
            <div className="text-emerald-500/80 tracking-[0.15em] text-lg overflow-hidden whitespace-nowrap leading-none">
              {progressBar}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 uppercase">
            <Terminal size={12} />
            <span>Kernel::Idle_Standby</span>
          </div>
        )}
      </div>

      {/* TERMINAL BODY */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto px-8 py-6 font-mono custom-scrollbar bg-black/20"
      >
        {scanLoading || agentLogs.length > 0 ? (
          <AgentLogs logs={agentLogs} />
        ) : (
          <div className="text-slate-700 text-xs italic font-mono">
            $ Waiting for neural uplink...
          </div>
        )}

        {/* FINAL REPORT */}
        {scanStatus === "COMPLETED" && (
          <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in duration-700">
            <div
              className={`p-4 rounded-2xl border ${suspiciousCount > 0 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldAlert size={14} /> Final Report
              </div>
              <p className="text-xs leading-relaxed font-mono whitespace-pre-wrap">
                {scanResult?.details?.message ||
                  (suspiciousCount > 0
                    ? `THREATS_FOUND: ${suspiciousCount} critical vulnerabilities detected.`
                    : "STATUS: Systems optimal. No threats detected.")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BUTTON */}
      <div className="p-8 border-t border-white/5 bg-black/40">
        <button
          onClick={onRunScan}
          disabled={scanLoading}
          className={`group w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden ${
            scanLoading
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          }`}
        >
          <span className="relative z-10">
            {scanLoading ? "Analysing_Data..." : "Execute_Deep_Scan()"}
          </span>
          {!scanLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          )}
        </button>
      </div>
    </div>
  );
}
