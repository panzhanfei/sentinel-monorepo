import { AnimatedNumber } from "@/app/src/components";

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

export function AssetList({ assets }: Props) {
  return (
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
  );
}
