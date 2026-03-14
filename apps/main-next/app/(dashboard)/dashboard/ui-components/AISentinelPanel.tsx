import { useRef, useEffect } from "react";
import type {
  ScanStatus,
  ScanResultData,
  AgentMessage,
  AllowanceAudit,
} from "../hooks/types";
import { Address } from "viem";
import { AgentLogs } from "./AgentLogs";

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

export function AISentinelPanel({
  scanLoading,
  scanProgress,
  scanStatus,
  scanResult,
  agentLogs,
  suspiciousCount,
  onRunScan,
}: Props) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [agentLogs, scanResult]);

  const progressBlocks = Math.floor(scanProgress / 6.25); // 16格
  const progressBar =
    "█".repeat(progressBlocks) + "░".repeat(16 - progressBlocks);

  return (
    <div className="bg-black text-white rounded-[2rem] border border-white/10 shadow-2xl flex flex-col sticky top-6 h-[720px] overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              scanLoading ? "bg-emerald-500 animate-pulse" : "bg-gray-600"
            }`}
          />
          <span className="font-mono text-xs text-emerald-400 tracking-wider">
            AI-SENTINEL TERMINAL
          </span>
        </div>

        <span className="text-[10px] font-mono text-gray-500">v3.2.0</span>
      </div>

      {/* PROGRESS */}
      <div className="px-6 py-4 border-b border-white/10 font-mono text-xs text-gray-400 space-y-2">
        {scanLoading ? (
          <>
            <div className="text-gray-400">Scanning contract...</div>

            <div className="text-emerald-400 tracking-widest text-sm">
              {progressBar} {scanProgress}%
            </div>
          </>
        ) : (
          <span>engine_status : idle</span>
        )}
      </div>

      {/* TERMINAL BODY */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto px-6 py-5 font-mono text-sm space-y-4"
      >
        {scanLoading ? (
          <AgentLogs logs={agentLogs} />
        ) : (
          <div className="text-gray-500">$ sentinel waiting...</div>
        )}

        {/* FINAL REPORT */}
        {scanStatus === "COMPLETED" && (
          <div className="pt-4 border-t border-white/10 text-emerald-400 leading-relaxed whitespace-pre-wrap">
            {scanResult?.details?.message ||
              (suspiciousCount > 0
                ? `ALERT :: ${suspiciousCount} threat exposures detected`
                : "STATUS :: system secure")}
          </div>
        )}
      </div>

      {/* BUTTON */}
      <div className="p-5 border-t border-white/10 bg-black">
        <button
          onClick={onRunScan}
          disabled={scanLoading}
          className={`w-full py-3 rounded-xl text-sm font-mono transition-all ${
            scanLoading
              ? "bg-gray-900 text-gray-600 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 text-black shadow-lg shadow-emerald-900/40"
          }`}
        >
          {scanLoading ? "running scan..." : "run_deep_scan()"}
        </button>
      </div>
    </div>
  );
}
