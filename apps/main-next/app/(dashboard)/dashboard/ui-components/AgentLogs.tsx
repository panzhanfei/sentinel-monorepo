import { AgentMessage } from "../hooks/types";

interface Props {
  logs: AgentMessage[];
}

export function AgentLogs({ logs }: Props) {
  return (
    <div className="font-mono text-[11px] text-emerald-400 leading-relaxed">
      {logs.map((log, i) => (
        <div
          key={i}
          className="animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <span className="text-emerald-500 mr-2">$</span>

          <span className="text-indigo-400 mr-2">[{log.agent}]</span>

          <span className="text-emerald-300">{log.content}</span>
        </div>
      ))}

      {logs.length === 0 && (
        <div className="text-emerald-500/60 italic">
          $ initializing sentinel agents...
        </div>
      )}

      {/* blinking cursor */}
      <div className="flex items-center mt-1">
        <span className="text-emerald-500 mr-2">$</span>
        <span className="w-2 h-4 bg-emerald-400 animate-pulse"></span>
      </div>
    </div>
  );
}
