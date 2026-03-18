export function MonitorSkeleton() {
  // 定义统一样式，方便维护
  const boxStyle = "bg-zinc-900/40 border border-white/5 animate-pulse";
  const innerBlockStyle = "bg-zinc-800/50 rounded";

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-8 font-mono overflow-hidden">
      {/* 1. Header 骨架 */}
      <header className="flex justify-between items-start mb-10 border-l-2 border-zinc-800/50 pl-6">
        <div className="space-y-4">
          {/* 标题占位：带有一点点靛青色的呼吸感 */}
          <div className={`h-9 w-72 rounded-lg bg-indigo-500/10 ${boxStyle}`} />
          <div className="flex gap-3">
            <div
              className={`h-5 w-48 rounded bg-zinc-900/60 border border-white/5 animate-pulse`}
            />
            <div
              className={`h-5 w-20 rounded bg-zinc-900/60 border border-white/5 animate-pulse`}
            />
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${boxStyle}`} />
      </header>

      {/* 2. V-1: 资产卡片区 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`p-6 rounded-3xl space-y-4 ${boxStyle}`}>
            <div className={`h-2 w-10 ${innerBlockStyle}`} />
            <div className={`h-7 w-24 ${innerBlockStyle}`} />
            <div className={`h-2 w-16 bg-zinc-800/30 rounded`} />
          </div>
        ))}
      </div>

      {/* 3. V-2 & V-4: 图表双子座布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className={`h-72 rounded-[3rem] ${boxStyle}`} />
        <div className={`h-72 rounded-[3rem] ${boxStyle}`} />
      </div>

      {/* 4. V-3: 哨兵部署区（深色渐变感占位） */}
      <div
        className={`p-10 rounded-[4rem] space-y-8 bg-zinc-900/20 border border-white/5`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl bg-zinc-800/80 animate-pulse`}
          />
          <div className="space-y-2">
            <div className={`h-5 w-44 bg-zinc-800/60 rounded animate-pulse`} />
            <div className={`h-3 w-72 bg-zinc-800/30 rounded animate-pulse`} />
          </div>
        </div>

        {/* 输入框组合 */}
        <div className="flex gap-4">
          <div
            className={`flex-1 h-16 rounded-2xl bg-black/40 border border-white/5 animate-pulse`}
          />
          <div
            className={`w-40 h-16 rounded-2xl bg-indigo-900/20 border border-indigo-500/10 animate-pulse`}
          />
        </div>

        {/* 列表占位 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-28 rounded-[2rem] ${boxStyle}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
