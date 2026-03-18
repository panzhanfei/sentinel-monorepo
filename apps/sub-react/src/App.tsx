import { useState } from "react";
import { useAuditData, type AuditDashboardProps } from "./useAuditData";

const AuditDashboard = ({
  txCount,
  txList,
  isLoading,
  logs,
  onSendMessage,
}: AuditDashboardProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 p-6 font-mono selection:bg-indigo-500/30">
      <div className="max-w-400 mx-auto space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* 左侧区域：数据展现 */}
          <div className="lg:col-span-3 space-y-10">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg
                    className="w-16 h-16"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  History_Intensity
                </p>
                <p className="text-4xl font-black text-white mt-3">
                  {txCount ?? 0}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">
                    Active_Identity
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Risk_Approvals
                </p>
                <p className="text-4xl font-black text-rose-500 mt-3">0</p>
                <p className="text-[10px] text-zinc-600 font-bold mt-3 uppercase tracking-tighter">
                  No_Threats_Detected
                </p>
              </div>
            </div>

            {/* 足迹列表 - 修改后与右侧等高且滚动 */}
            <section className="bg-zinc-950/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 overflow-hidden h-150 flex flex-col">
              <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/2 shrink-0">
                <h3 className="font-black text-white italic tracking-widest uppercase text-sm">
                  Footprint_Scanner
                </h3>
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-zinc-950/40 z-10">
                    <tr className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">TX_Hash</th>
                      <th className="px-8 py-5 text-center">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {txList?.map((tx) => (
                      <tr
                        key={tx.hash}
                        className="hover:bg-indigo-500/5 transition-all group cursor-crosshair"
                      >
                        <td className="px-8 py-6">
                          <span className="font-mono text-xs text-zinc-400 group-hover:text-indigo-400 transition-colors">
                            {tx.hash.slice(0, 18)}...
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-black text-zinc-200">
                            {(parseFloat(tx.value) / 1e18).toFixed(4)}{" "}
                            <span className="text-zinc-600">ETH</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* 右侧区域：AI Agent 协作终端 */}
          <div className="lg:col-span-2">
            <div className="bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 h-200 flex flex-col shadow-2xl relative overflow-hidden">
              {/* 终端头部 */}
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">
                    Agent_Terminal_v1.0
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded border border-emerald-500/30 text-[8px] text-emerald-500 font-bold animate-pulse">
                  LIVE_STREAM
                </div>
              </div>

              {/* 终端输出区 */}
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
                <div className="flex gap-2 text-indigo-500 animate-bounce mt-4">
                  _
                </div>
              </div>

              {/* 终端输入区 */}
              <form
                onSubmit={handleSubmit}
                className="p-8 border-t border-white/5 bg-zinc-900/20"
              >
                <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl px-6 py-4">
                  <span className="text-indigo-500 font-bold">{">"}</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask agents for deep analysis..."
                    className="bg-transparent outline-none flex-1 text-zinc-300 placeholder:text-zinc-700 text-xs"
                  />
                </div>
              </form>

              {/* 装饰用光晕 */}
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const { address, txCount, txList, isLoading, logs, sendMessageToAgent } =
    useAuditData();

  return (
    <AuditDashboard
      address={address}
      txCount={txCount}
      txList={txList}
      isLoading={isLoading}
      logs={logs}
      onSendMessage={sendMessageToAgent}
    />
  );
};

export default App;
