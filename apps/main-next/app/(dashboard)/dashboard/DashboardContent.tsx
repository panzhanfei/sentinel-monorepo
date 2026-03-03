"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { formatCurrency, shortenAddress } from "@/app/src/utils/format";
import { useAssetsData } from "@/app/src/hooks";

export default function DashboardContent() {
  const { address } = useAccount();
  const [balance, setBalance] = useState("0.00");
  const { data: balanceData, isFetching } = useBalance({ address });
  const { assets, isLoading } = useAssetsData();

  useEffect(() => {
    if (balanceData && address) {
      // 1. 计算真数据
      const val = formatUnits(balanceData.value, balanceData.decimals);
      const displayVal = Number(val).toFixed(4);

      // 2. 异步更新状态，避开同步级联渲染报错
      const timer = setTimeout(() => {
        // 使用函数式更新，确保不依赖外部 balance 变量
        setBalance((prev) => {
          if (prev === displayVal) return prev;

          // 同步到缓存
          sessionStorage.setItem(`sentinel_bal_${address}`, displayVal);
          return displayVal;
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [balanceData, address]); // 去掉 balance 依赖，防止死循环

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-1">
      <section className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Total Net Worth
            </span>
            {isFetching && (
              <div className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded-full">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-indigo-600 font-bold uppercase">
                  Syncing
                </span>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
              {formatCurrency(Number(balance) * 2341)}
            </h1>
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full text-sm font-bold">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              4.2%
            </div>
          </div>
        </div>
      </section>

      {/* 核心网格布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-8 rounded-4xl border border-white shadow-2xl shadow-slate-200/50 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Main Assets</h3>
            <button className="text-sm text-indigo-600 font-semibold hover:underline">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {assets.map((token) => (
              <div
                key={token.symbol}
                className="flex justify-between items-center py-5 group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 ${token.color} rounded-2xl rotate-3 group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center text-white font-bold shadow-lg`}
                  >
                    {token.symbol[0]}
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {token.name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-slate-900">
                    {token.val}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {token.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-4xl text-white shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
          <h3 className="text-xl font-bold relative z-10">Security Audit</h3>
          <div className="space-y-6 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
              <div className="flex gap-4 items-start">
                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>
                <div>
                  <p className="text-sm font-bold text-slate-100">
                    Address Risk Scan
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {/* {scanTime || "正在计算..."} · Status:{" "} */}
                    {"正在计算..."} · Status:{" "}
                    <span className="text-emerald-400">Secure</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
              <div className="flex gap-4 items-start">
                <div className="w-2 h-2 mt-2 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]"></div>
                <div>
                  <p className="text-sm font-bold text-slate-100">
                    Suspicious Contract
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Found 1 active allowance
                  </p>
                  <p className="text-[10px] font-mono text-indigo-300 mt-2 bg-indigo-500/10 p-1 rounded inline-block">
                    Target:{" "}
                    {shortenAddress(
                      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20">
            Run Deep Scan
          </button>
        </div>
      </div>
    </div>
  );
}
