import { AnimatedNumber } from "@/app/src/components";

interface Props {
  totalValue: number;
  priceChange: number;
  suspiciousCount: number;
  scanStatus: string;
}

export function PortfolioHeader({
  totalValue,
  priceChange,
  suspiciousCount,
  scanStatus,
}: Props) {
  return (
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
            className={`px-3 py-1 rounded-full text-xs font-black ${
              priceChange >= 0
                ? "text-emerald-600 bg-emerald-50"
                : "text-rose-600 bg-rose-50"
            }`}
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
            {scanStatus === "COMPLETED" ? suspiciousCount : "--"}
          </span>
          <span className="text-sm font-bold opacity-80 leading-tight">
            Active Threat
            <br />
            Exposures
          </span>
        </div>
      </div>
    </section>
  );
}
