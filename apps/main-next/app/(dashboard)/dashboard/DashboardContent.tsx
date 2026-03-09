"use client";

import { shortenAddress } from "@/app/src/utils/format";
import { useDashboardData } from "./hooks/useDashboardData";
import { AnimatedNumber } from "@/app/src/components/AnimatedNumber";

export default function DashboardContent() {
  const {
    isFetching,
    assets,
    priceChange,
    totalValue,
    scanLoading,
    scanProgress,
    scanStatus,
    handleRunDeepScan,
  } = useDashboardData();

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 p-2 sm:p-4 md:p-1">
      {/* 总资产卡片 */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Total Net Worth
            </span>
            {isFetching && (
              <div className="flex items-center gap-1 md:gap-2 px-2 py-1 bg-indigo-50 rounded-full">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] md:text-[10px] text-indigo-600 font-bold uppercase">
                  Syncing
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm ">
              <AnimatedNumber value={totalValue} />
            </h1>
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
              {priceChange >= 0 ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)}%
            </div>
          </div>
        </div>
      </section>

      {/* 主要内容网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Main Assets Section */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-4xl border border-white shadow-xl md:shadow-2xl shadow-slate-200/50 space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg md:text-xl font-bold text-slate-800">
              Main Assets
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {assets.map((token) => (
              <div
                key={token.symbol}
                className="flex justify-between items-center py-3 md:py-5 group cursor-pointer"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 ${token.color} rounded-xl md:rounded-2xl rotate-3 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center text-white font-bold shadow-md md:shadow-lg text-sm md:text-base`}
                  >
                    {token.symbol[0]}
                  </div>
                  <div>
                    <div className="text-sm md:text-base font-bold text-slate-900">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {token.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm md:text-base font-black text-slate-900">
                    <AnimatedNumber value={token.val} />
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {token.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Audit 模块 */}
        <div className="bg-slate-900 p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-4xl text-white shadow-xl md:shadow-2xl space-y-6 md:space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-lg md:text-xl font-bold">Security Audit</h3>
            {scanLoading && (
              <span className="text-[8px] md:text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md animate-pulse">
                AI SCANNING
              </span>
            )}
          </div>

          <div className="space-y-4 md:space-y-6 relative z-10">
            {/* 动态扫描状态展示 */}
            <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 hover:bg-white/10 transition">
              <div className="flex gap-3 md:gap-4 items-start">
                <div
                  className={`w-2 h-2 mt-2 rounded-full ${
                    scanStatus === "COMPLETED"
                      ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                      : "bg-indigo-400 animate-bounce"
                  }`}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-bold text-slate-100">
                    AI Deep Analysis
                  </p>

                  {(scanLoading || scanProgress > 0) && (
                    <div className="mt-2 md:mt-3 space-y-1 md:space-y-2">
                      <div className="flex justify-between text-[8px] md:text-[10px] font-mono text-indigo-300">
                        <span>PROGRESS</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_8px_#6366f1]"
                          style={{ width: `${scanProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-2 capitalizewrap-break-word">
                    Status:{" "}
                    <span
                      className={
                        scanStatus === "COMPLETED"
                          ? "text-emerald-400"
                          : "text-indigo-300"
                      }
                    >
                      {scanStatus}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 hover:bg-white/10 transition">
              <div className="flex gap-3 md:gap-4 items-start">
                <div className="w-2 h-2 mt-2 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]"></div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-bold text-slate-100">
                    Suspicious Contract
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Found 1 active allowance
                  </p>
                  <p className="text-[8px] md:text-[10px] font-mono text-indigo-300 mt-2 bg-indigo-500/10 p-1 rounded inline-block break-all">
                    Target:{" "}
                    {shortenAddress(
                      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunDeepScan}
            disabled={scanLoading}
            className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg ${
              scanLoading
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-95"
            }`}
          >
            {scanLoading ? `Scanning ${scanProgress}%...` : "Run Deep Scan"}
          </button>
        </div>
      </div>
    </div>
  );
}
