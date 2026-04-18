import type { ChatRow } from "@/types/audit";
import type { IAgentTerminalProps } from "./interface";
import { useAgentTerminalData } from "./useData";

const ChatRowView = ({ row }: { row: ChatRow }) => {
  const log = row.entry;
  if (log.type === "user") {
    return (
      <div className="flex justify-end pb-4">
        <div className="max-w-[min(100%,28rem)] rounded-2xl bg-indigo-500/15 border border-indigo-400/25 px-4 py-3 shadow-lg">
          <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">
            You
          </div>
          <p className="text-zinc-100 leading-relaxed whitespace-pre-wrap text-[13px] font-sans">
            {log.msg}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 group pb-4">
      <span
        className={`shrink-0 font-black ${
          log.type === "sys"
            ? "text-zinc-600"
            : log.type === "error"
              ? "text-rose-500"
              : "text-indigo-500"
        }`}
      >
        [{log.agent}]
      </span>
      <span
        className={`leading-relaxed whitespace-pre-wrap ${
          log.type === "error"
            ? "text-rose-300/90"
            : "text-zinc-400 group-hover:text-zinc-200 transition-colors"
        }`}
      >
        {log.msg}
      </span>
    </div>
  );
}

export const AgentTerminal = ({
  chatRows,
  onSendMessage,
  isStreaming = false,
  queuedMessageCount = 0,
  hasMoreChatHistory = false,
  isLoadingOlderChat = false,
  onRequestOlderChat,
}: IAgentTerminalProps) => {
  const {
    inputValue,
    setInputValue,
    scrollRef,
    virtualizer,
    virtualItems,
    handleSubmit,
  } = useAgentTerminalData({
    chatRows,
    onSendMessage,
    isStreaming,
    queuedMessageCount,
    hasMoreChatHistory,
    isLoadingOlderChat,
    onRequestOlderChat,
  });

  return (
    <div className="bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 h-200 flex flex-col shadow-2xl relative overflow-hidden">
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/20 shrink-0">
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
        <div className="flex items-center gap-2">
          {queuedMessageCount > 0 && (
            <span className="px-2 py-0.5 rounded border border-amber-500/35 text-[8px] font-bold text-amber-400">
              QUEUE:{queuedMessageCount}
            </span>
          )}
          <div
            className={`px-2 py-0.5 rounded border text-[8px] font-bold ${
              isStreaming
                ? "border-amber-500/40 text-amber-400 animate-pulse"
                : "border-emerald-500/30 text-emerald-500 animate-pulse"
            }`}
          >
            {isStreaming ? "STREAMING" : "READY"}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 px-8 overflow-y-auto font-mono text-xs scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {hasMoreChatHistory && (
          <div className="py-3 text-center text-[10px] text-zinc-500 shrink-0">
            {isLoadingOlderChat
              ? "加载更早消息…"
              : "下拉或滚至顶部加载更早记录"}
          </div>
        )}

        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((vi) => {
            const row = chatRows[vi.index];
            if (!row) return null;
            return (
              <div
                key={vi.key}
                data-index={vi.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full px-0"
                style={{
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                <ChatRowView row={row} />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 text-indigo-500 animate-bounce mt-4 pb-2">_</div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-8 border-t border-white/5 bg-zinc-900/20 shrink-0"
      >
        <div
          className={`flex items-center gap-4 rounded-2xl px-6 py-4 border ${
            isStreaming
              ? "bg-black/30 border-amber-500/15"
              : "bg-black/40 border-white/10"
          }`}
        >
          <span className="text-indigo-500 font-bold">{">"}</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isStreaming
                ? "Queue message — sent after current reply finishes..."
                : "Ask agents for deep analysis..."
            }
            className="bg-transparent outline-none flex-1 text-zinc-300 placeholder:text-zinc-600 text-xs"
          />
        </div>
      </form>

      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/10 blur-[120px] pointer-events-none" />
    </div>
  );
}
