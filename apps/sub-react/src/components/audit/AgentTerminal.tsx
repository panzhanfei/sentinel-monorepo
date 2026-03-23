import { useState, type FormEvent } from "react";
import type { LogEntry } from "@/types/audit";

interface AgentTerminalProps {
  logs: LogEntry[];
  onSendMessage: (msg: string) => void;
  /** AI 流式输出中禁止输入与发送 */
  inputLocked?: boolean;
}

export function AgentTerminal({
  logs,
  onSendMessage,
  inputLocked = false,
}: AgentTerminalProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputLocked) return;
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      setInputValue("");
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 h-200 flex flex-col shadow-2xl relative overflow-hidden">
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">
            Agent_Terminal_v1.0
          </span>
        </div>
        <div
          className={`px-2 py-0.5 rounded border text-[8px] font-bold ${
            inputLocked
              ? "border-amber-500/40 text-amber-400 animate-pulse"
              : "border-emerald-500/30 text-emerald-500 animate-pulse"
          }`}
        >
          {inputLocked ? "AGENT_TYPING" : "LIVE_STREAM"}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto font-mono text-xs space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-4 group">
            <span
              className={`shrink-0 font-black ${log.type === "sys" ? "text-zinc-600" : "text-indigo-500"}`}
            >
              [{log.agent}]
            </span>
            <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">
              {log.msg}
            </span>
          </div>
        ))}
        <div className="flex gap-2 text-indigo-500 animate-bounce mt-4">_</div>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`p-8 border-t border-white/5 bg-zinc-900/20 ${inputLocked ? "pointer-events-none opacity-70" : ""}`}
      >
        <div
          className={`flex items-center gap-4 rounded-2xl px-6 py-4 border ${
            inputLocked
              ? "bg-black/25 border-white/5"
              : "bg-black/40 border-white/10"
          }`}
        >
          <span className="text-indigo-500 font-bold">{">"}</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            readOnly={inputLocked}
            disabled={inputLocked}
            placeholder={
              inputLocked
                ? "Waiting for agent response..."
                : "Ask agents for deep analysis..."
            }
            className="bg-transparent outline-none flex-1 text-zinc-300 placeholder:text-zinc-600 text-xs disabled:cursor-not-allowed disabled:text-zinc-500"
          />
        </div>
      </form>

      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/10 blur-[120px] pointer-events-none" />
    </div>
  );
}
