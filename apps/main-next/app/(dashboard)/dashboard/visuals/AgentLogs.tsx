"use client";
import { AgentMessage } from "../hooks/types";

interface Props {
  logs: AgentMessage[];
}

export function AgentLogs({ logs }: Props) {
  return (
    <div className="font-mono text-[11px] leading-relaxed">
      {logs.map((log, i) => (
        <div
          key={i}
          className="animate-in fade-in slide-in-from-bottom-1 duration-300 mb-1"
        >
          <span className="text-emerald-500/50 mr-2 opacity-70">$</span>
          <span className="text-blue-400 font-bold mr-2">
            [{log.agent.toUpperCase()}]
          </span>
          <span className="text-emerald-400/90">{log.content}</span>
        </div>
      ))}

      {logs.length === 0 && (
        <div className="text-emerald-500/40 italic animate-pulse">
          $ INITIALIZING_SENTINEL_PROTOCOLS...
        </div>
      )}

      {/* blinking cursor */}
      <div className="flex items-center mt-2">
        <span className="text-emerald-500/50 mr-2">$</span>
        <span className="w-1.5 h-3.5 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
      </div>
    </div>
  );
}
