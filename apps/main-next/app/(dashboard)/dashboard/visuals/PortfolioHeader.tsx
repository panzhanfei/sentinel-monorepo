"use client";
import { AnimatedNumber } from "@/app/src/components";
import { TrendingUp, TrendingDown, Radar, Target, Shield } from "lucide-react";

interface Props {
  totalValue: number;
  priceChange: number;
  suspiciousCount: number;
  scanStatus: string;
}

export const PortfolioHeader = ({
  totalValue,
  priceChange,
  suspiciousCount,
  scanStatus,
}: Props) => {
  const isPositive = priceChange >= 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* 余额面板 */}
      <div className="md:col-span-2 bg-slate-950/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          <Radar size={200} strokeWidth={1} />
        </div>

        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
          <Target size={12} className="text-blue-500" /> Total Capital Exposure
        </p>

        <div className="flex items-baseline gap-6">
          <h1 className="text-6xl md:text-6xl font-black text-white tracking-tighter leading-none">
            <span className="text-blue-500 text-3xl mr-2 font-mono italic font-light"></span>
            <AnimatedNumber value={totalValue} />
          </h1>
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-black flex items-center gap-2 border ${isPositive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(priceChange).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 风险状态面板 */}
      <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] flex flex-col justify-center relative overflow-hidden group border border-white/20">
        <div className="absolute -top-6 -right-6 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700 ease-out rotate-12">
          <Shield size={120} strokeWidth={1} />
        </div>

        <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-3 opacity-80">
          Security Protocol
        </p>

        <div className="flex items-center gap-5">
          <span className="text-6xl font-black font-mono tracking-tighter drop-shadow-lg">
            {scanStatus === "COMPLETED"
              ? suspiciousCount.toString().padStart(2, "0")
              : "--"}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tighter leading-none mb-1">
              Threats
            </span>
            <span className="text-[9px] font-mono opacity-70 tracking-widest uppercase">
              Detected_Exposures
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${suspiciousCount > 0 ? "bg-rose-400 w-full animate-pulse" : "bg-emerald-400 w-1/3"}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
