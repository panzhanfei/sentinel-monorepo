"use client";

import { useAccount } from "wagmi";
import { useDashboardData } from "./hooks/useDashboardData";
import { AnimatedNumber } from "@/app/src/components/AnimatedNumber";
import { AllowanceResult } from "@sentinel/security-sdk";
import { Address } from "viem"; // 💡 引入 Address 类型确保安全

export default function DashboardContent() {
  const { status, address: accountAddress } = useAccount();

  const {
    address,
    isConnected,
    assets,
    priceChange,
    totalValue,
    scanLoading,
    scanProgress,
    scanStatus,
    scanResult,
    suspiciousCount,
    handleRunDeepScan,
    handleRevoke,
  } = useDashboardData();

  // --- 1. 状态拦截：连接中 ---
  if (status === "connecting" || status === "reconnecting") {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-4 md:p-6">
        <div className="h-48 bg-slate-50 rounded-[2.5rem] border border-slate-100" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 h-96 bg-slate-50 rounded-[2.5rem] border border-slate-100" />
          <div className="lg:col-span-2 h-96 bg-slate-900/5 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  // --- 2. 状态拦截：未连接 ---
  if (status === "disconnected" || !isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-112.5 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-slate-300 mx-4">
        <div className="p-4 bg-indigo-50 rounded-2xl mb-6 animate-bounce">
          <span className="text-3xl">🛡️</span>
        </div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          Sentinel Guard Locked
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium px-8 text-center max-w-sm">
          Authentication required. Please connect your wallet to synchronize
          real-time chain data.
        </p>
      </div>
    );
  }

  // --- 3. 正常业务逻辑 ---
  const riskAllowances: AllowanceResult[] =
    scanResult?.allowances?.filter(
      (a: AllowanceResult) => BigInt(a.rawAllowance) > BigInt(0),
    ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 p-4 md:p-6">
      {/* 顶部：总览仪表盘 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Portfolio Balance
          </p>
          <div className="flex items-baseline gap-4">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
              <AnimatedNumber value={totalValue} />
            </h1>
            <div
              className={`px-3 py-1 rounded-full text-xs font-black ${priceChange >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}
            >
              {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="text-6xl">📡</span>
          </div>
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">
            Risk Status
          </p>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black">
              {scanStatus === "COMPLETED" ? riskAllowances.length : "--"}
            </span>
            <span className="text-sm font-bold opacity-80 leading-tight">
              Active Threat
              <br />
              Exposures
            </span>
          </div>
        </div>
      </section>

      {/* 主展示区 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* 左侧：资产详情 */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Verified Assets
              </h3>
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Live Mainnet
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {assets.map((token) => (
                <div
                  key={token.symbol}
                  className="flex justify-between items-center p-4 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 group shadow-sm hover:shadow"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 ${token.color} rounded-xl flex items-center justify-center text-white text-lg font-black shadow-inner group-hover:scale-110 transition-transform`}
                    >
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="text-md font-bold text-slate-900 leading-none">
                        {token.symbol}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                        {token.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 leading-none mb-1">
                      <AnimatedNumber value={token.val} />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">
                      {token.price} USD
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：AI SENTINEL */}
        <div className="lg:col-span-2 bg-slate-950 p-7 rounded-[2.5rem] text-white shadow-2xl flex flex-col sticky top-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              <h3 className="text-lg font-black tracking-tighter italic text-indigo-400">
                AI SENTINEL
              </h3>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-white/10 rounded-full font-mono text-slate-400">
              V3.1.0
            </span>
          </div>

          <div className="space-y-5 flex-1 flex flex-col min-h-0">
            {/* 引擎进度 */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                <span>{scanLoading ? "Analysing" : "Engine Status"}</span>
                <span className="text-indigo-400">{scanProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            </div>

            {/* 风险列表 */}
            <div className="flex-1 flex flex-col min-h-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 opacity-60">
                Threat Radar
              </p>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {scanStatus === "COMPLETED" ? (
                  riskAllowances.length > 0 ? (
                    riskAllowances.map((item, idx: number) => (
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
                            {/* 💡 这里是修改点：绑定 handleRevoke */}
                            <button
                              onClick={() =>
                                handleRevoke(
                                  item.tokenAddress as Address,
                                  item.spenderAddress as Address,
                                )
                              }
                              className="text-[9px] font-black text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-300 hover:underline active:scale-90"
                            >
                              REVOKE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/20">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        System Secured
                      </p>
                    </div>
                  )
                ) : (
                  <div className="py-12 text-center opacity-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                      Standby
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 底部 AI 结论 */}
            {scanStatus === "COMPLETED" && (
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  {scanResult?.details?.message ||
                    (suspiciousCount > 0
                      ? `Alert: ${suspiciousCount} threats detected. Risk of drain if exploited.`
                      : "Status: Pristine. All monitored approvals are safe.")}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleRunDeepScan}
            disabled={scanLoading}
            className={`w-full py-4 mt-6 rounded-2xl font-black text-xs transition-all tracking-widest active:scale-[0.98] ${
              scanLoading
                ? "bg-slate-900 text-slate-700 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
            }`}
          >
            {scanLoading ? "ANALYZING..." : "DEEP INSPECTION"}
          </button>
        </div>
      </div>
    </div>
  );
}
