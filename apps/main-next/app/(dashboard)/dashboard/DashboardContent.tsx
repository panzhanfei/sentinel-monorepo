"use client";

import { useEffect, useState, useRef } from "react"; // 增加 useRef 处理定时器
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { formatCurrency, shortenAddress } from "@/app/src/utils/format";
import { useAssetsData } from "@/app/src/hooks";

export default function DashboardContent() {
  const { address } = useAccount();
  const [balance, setBalance] = useState("0.00");
  const { data: balanceData, isFetching } = useBalance({ address });
  const { assets, isLoading } = useAssetsData();

  // --- 新增：Deep Scan 相关状态 ---
  const [scanLoading, setScanLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Idle"); // Idle, pending, processing, completed
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // 轮询函数：查询 Redis 里的进度
  const checkScanStatus = async () => {
    try {
      const res = await fetch(
        `/api/scan/status?address=${address?.toLowerCase()}`,
      );
      const data = await res.json();

      if (data.status) {
        setScanStatus(data.status);
        setScanProgress(data.progress || 0);

        if (data.status === "completed") {
          setScanLoading(false);
          if (pollTimer.current) clearInterval(pollTimer.current);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  // 启动扫描按钮点击事件
  const handleRunDeepScan = async () => {
    if (!address || scanLoading) return;

    setScanLoading(true);
    setScanProgress(0);
    setScanStatus("pending");

    try {
      // 1. 调用生产者接口塞入队列
      await fetch("/api/scan/run", {
        method: "POST",
        body: JSON.stringify({ address }),
      });

      // 2. 开启每秒轮询
      pollTimer.current = setInterval(checkScanStatus, 1000);
    } catch (error) {
      setScanLoading(false);
      alert("Failed to start scan");
    }
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (balanceData && address) {
      const val = formatUnits(balanceData.value, balanceData.decimals);
      const displayVal = Number(val).toFixed(4);
      const timer = setTimeout(() => {
        setBalance((prev) => {
          if (prev === displayVal) return prev;
          sessionStorage.setItem(`sentinel_bal_${address}`, displayVal);
          return displayVal;
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [balanceData, address]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-1">
      {/* Total Net Worth Section (保持不变) */}
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
              ↑ 4.2%
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Assets Section (保持不变) */}
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

        {/* --- 深度优化的 Security Audit 模块 --- */}
        <div className="bg-slate-900 p-8 rounded-4xl text-white shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-xl font-bold">Security Audit</h3>
            {scanLoading && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md animate-pulse">
                AI SCANNING
              </span>
            )}
          </div>

          <div className="space-y-6 relative z-10">
            {/* 动态扫描状态展示 */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
              <div className="flex gap-4 items-start">
                <div
                  className={`w-2 h-2 mt-2 rounded-full ${scanStatus === "completed" ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-indigo-400 animate-bounce"}`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-100">
                    AI Deep Analysis
                  </p>

                  {/* 进度条实现 */}
                  {(scanLoading || scanProgress > 0) && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-indigo-300">
                        <span>PROGRESS</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_8px_#6366f1]"
                          style={{ width: `${scanProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-2 capitalize">
                    Status:{" "}
                    <span
                      className={
                        scanStatus === "completed"
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

            {/* 原有的 Suspicious Contract 项 */}
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

          <button
            onClick={handleRunDeepScan}
            disabled={scanLoading}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
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
