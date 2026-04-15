"use client";

export const AuditSkeleton = () => {
  // 统一定义赛博脉动样式
  const pulseClass = "animate-pulse bg-zinc-900/50 border border-white/5";
  const blockClass = "bg-zinc-800/40 rounded-lg";

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-6 font-mono overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* --- 顶部统计：审计概览 --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            className={`md:col-span-2 p-10 rounded-[2.5rem] h-48 flex flex-col justify-center ${pulseClass}`}
          >
            <div className={`h-3 w-40 mb-6 ${blockClass}`} />
            <div className="flex items-baseline gap-4">
              <div className={`h-14 w-64 rounded-2xl bg-zinc-800/60`} />
              <div className={`h-6 w-20 rounded-full bg-zinc-800/30`} />
            </div>
          </div>

          <div
            className={`p-10 rounded-[2.5rem] h-48 flex flex-col justify-center bg-indigo-500/5 border border-indigo-500/10 animate-pulse`}
          >
            <div className={`h-3 w-28 mb-4 bg-indigo-400/20 rounded-full`} />
            <div className={`h-12 w-24 bg-indigo-400/20 rounded-xl`} />
            {/* 模拟 Agent 扫描状态的小点 */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500/20"
                />
              ))}
            </div>
          </div>
        </section>

        {/* --- 主布局：资产列表 vs AI 协作终端 --- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* 左侧：资产与安全风险列表 */}
          <div className="lg:col-span-3 space-y-10">
            {/* 资产扫描列表 */}
            <div className={`p-10 rounded-[3rem] space-y-8 ${pulseClass}`}>
              <div className="flex justify-between items-center">
                <div className={`h-6 w-48 ${blockClass}`} />
                <div className={`h-4 w-24 rounded-full bg-zinc-800/30`} />
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-6 bg-white/[0.02] rounded-[2rem] border border-white/5"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 bg-zinc-800/60 rounded-2xl`} />
                    <div className="space-y-3">
                      <div className={`h-4 w-20 ${blockClass}`} />
                      <div className={`h-3 w-32 bg-zinc-900 rounded`} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`h-5 w-24 ${blockClass} ml-auto`} />
                    <div className={`h-3 w-16 bg-zinc-900 rounded ml-auto`} />
                  </div>
                </div>
              ))}
            </div>

            {/* 风险告警区 */}
            <div className={`p-10 rounded-[3rem] h-72 ${pulseClass}`}>
              <div className={`h-6 w-56 mb-8 ${blockClass}`} />
              <div className="space-y-4">
                <div className="h-20 w-full bg-rose-500/5 rounded-2xl border border-rose-500/10" />
                <div className="h-20 w-full bg-zinc-800/10 rounded-2xl border border-white/5" />
              </div>
            </div>
          </div>

          {/* 右侧：AI 协作多代理终端 (核心审计区) */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 h-[780px] flex flex-col relative overflow-hidden">
              {/* 终端头部：模拟多 Agent 标签 */}
              <div className="px-8 py-6 border-b border-white/5 flex gap-4">
                <div className={`h-4 w-32 ${blockClass}`} />
                <div className="flex gap-2 ml-auto">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                </div>
              </div>

              {/* 模拟代码/合约输入区域 */}
              <div className="px-8 py-6 border-b border-white/5">
                <div className="h-12 w-full bg-black/40 rounded-xl border border-white/5" />
              </div>

              {/* 模拟 Agent 实时输出流 */}
              <div className="p-8 space-y-6 flex-1">
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-indigo-500/20 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-zinc-800 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-2/3 bg-emerald-500/10 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-zinc-800 rounded" />
                </div>
                <div className="h-[2px] w-full bg-white/5 my-4" />
                <div className="h-3 w-5/6 bg-zinc-800 rounded" />
                <div className="h-3 w-4/6 bg-zinc-800 rounded" />
                <div className="h-3 w-1/4 bg-zinc-800 rounded" />
              </div>

              {/* 终端底部输入占位 */}
              <div className="p-10 border-t border-white/5 bg-black/20">
                <div className="h-16 w-full bg-zinc-800/40 rounded-2xl border border-white/5 flex items-center px-6">
                  <div className="h-2 w-32 bg-zinc-700 rounded" />
                </div>
              </div>

              {/* 底部装饰：模拟 Agent 协作光晕 */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
