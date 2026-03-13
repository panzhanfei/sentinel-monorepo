"use client";

import React, { useRef, useEffect } from "react";
import { AgentMessage } from "@/app/src/types/audit";

interface TerminalProps {
  logs: AgentMessage[];
  loading: boolean;
  progress: number;
  onScan: () => void;
  handleRevoke: () => void;
}

export const AiAgentTerminal: React.FC<TerminalProps> = ({
  logs,
  loading,
  progress,
  onScan,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs]);

  return (
    <div className="bg-slate-950 p-7 rounded-[2.5rem] text-white shadow-2xl border border-white/5 h-145 flex flex-col relative overflow-hidden group">
      {/* 装饰背景：扫描线动效 */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%]" />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${loading ? "bg-indigo-500 animate-ping" : "bg-slate-700"}`}
          />
          <h3 className="text-lg font-black tracking-tighter italic text-indigo-400">
            AI SENTINEL
          </h3>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          SYS_V3.1.0_STABLE
        </span>
      </div>

      {/* 终端内容区 */}
      <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-5 font-mono text-[11px] overflow-hidden flex flex-col relative z-10">
        <div className="flex justify-between mb-4 text-[10px] text-slate-500 border-b border-white/5 pb-2">
          <span className="flex items-center gap-2">
            STATUS:{" "}
            <span className={loading ? "text-indigo-400" : "text-slate-600"}>
              {loading ? "DEBATING" : "IDLE"}
            </span>
          </span>
          <span>{progress}%</span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar scroll-smooth"
        >
          {logs.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
              <div className="text-3xl opacity-20">📡</div>
              <p className="tracking-[0.2em] text-[9px]">
                AWAITING DEEP INSPECTION
              </p>
            </div>
          )}

          {logs.map((log, i) => (
            <div
              key={i}
              className="animate-in fade-in slide-in-from-left-2 duration-500"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-indigo-500 font-bold tracking-tighter">
                  [{log.agent}]
                </span>
                {log.status === "thinking" && (
                  <span className="text-[10px] animate-pulse">...</span>
                )}
              </div>
              <div className="pl-3 border-l border-white/10 text-slate-300 leading-relaxed wrap-break-word">
                {log.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onScan}
        disabled={loading}
        className={`w-full py-4 mt-6 rounded-2xl font-black text-xs tracking-[0.2em] transition-all relative z-10 active:scale-95 ${
          loading
            ? "bg-slate-900 text-slate-700 cursor-wait"
            : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 text-white"
        }`}
      >
        {loading ? "PROCESSING DATA..." : "DEEP INSPECTION"}
      </button>
    </div>
  );
};
