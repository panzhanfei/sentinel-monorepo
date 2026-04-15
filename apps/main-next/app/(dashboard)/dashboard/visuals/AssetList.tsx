"use client";
import { AnimatedNumber } from "@/app/src/components";
import { Coins } from "lucide-react";

interface Asset {
  name: string;
  symbol: string;
  val: number;
  price: string;
  color: string;
  address: string;
}

interface Props {
  assets: Asset[];
}

export const AssetList = ({ assets }: Props) => {
  return (
    <div className="bg-slate-950/30 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Coins className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">
              Verified Assets
            </h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
              Neural_Chain_Verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[9px] font-black text-emerald-400 tracking-tighter uppercase font-mono">
            Real-time
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assets.map((token) => (
          <div
            key={token.symbol}
            className="flex justify-between items-center p-5 bg-white/[0.02] hover:bg-white/[0.06] rounded-[1.5rem] transition-all duration-300 border border-white/5 hover:border-blue-500/30 group cursor-default"
          >
            <div className="flex items-center gap-5">
              <div
                className={`w-14 h-14 ${token.color} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-2xl group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500`}
              >
                {token.symbol[0]}
              </div>
              <div>
                <div className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                  {token.symbol}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1 font-medium">
                  {token.name.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-white font-mono tracking-tighter mb-1 leading-none group-hover:scale-105 transition-transform origin-right">
                <AnimatedNumber value={token.val} />
              </div>
              <div className="text-[10px] text-slate-500 font-mono font-bold tracking-widest opacity-70">
                {token.price} <span className="text-slate-700 ml-1">USD</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
