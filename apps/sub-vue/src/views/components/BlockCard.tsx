export const BlockCard = ({
  name,
  height,
}: {
  name: string;
  height: number;
}) => (
  <div class="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all">
    <div class="flex justify-between items-start mb-4">
      <span class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
        {name}
      </span>
      <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
    </div>
    <div class="text-2xl font-mono font-black tracking-tighter text-white animate-in fade-in slide-in-from-right-2 duration-500">
      {height.toLocaleString()}
    </div>
  </div>
);
