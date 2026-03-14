"use client";

export function AuditSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-10 animate-pulse">
      {/* 顶部统计卡片骨架 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 h-48 flex flex-col justify-center">
          <div className="h-3 w-32 bg-slate-800 rounded-full mb-6" />
          <div className="flex items-baseline gap-4">
            <div className="h-14 w-48 bg-slate-800 rounded-2xl" />
            <div className="h-6 w-16 bg-slate-800 rounded-full" />
          </div>
        </div>

        <div className="bg-blue-600/20 backdrop-blur-xl p-10 rounded-[2.5rem] border border-blue-500/20 h-48 flex flex-col justify-center">
          <div className="h-3 w-24 bg-blue-400/20 rounded-full mb-4" />
          <div className="h-12 w-20 bg-blue-400/20 rounded-xl" />
        </div>
      </section>

      {/* 主布局网格骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* 左侧：资产与风险列表 */}
        <div className="lg:col-span-3 space-y-10">
          {/* 资产列表骨架 */}
          <div className="bg-slate-950/30 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-40 bg-slate-800 rounded-lg" />
              <div className="h-4 w-20 bg-slate-800 rounded-full" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-slate-800 rounded" />
                    <div className="h-3 w-24 bg-slate-900 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-20 bg-slate-800 rounded ml-auto" />
                  <div className="h-3 w-16 bg-slate-900 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>

          {/* 风险列表骨架 */}
          <div className="bg-slate-950/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 h-64">
            <div className="h-6 w-48 bg-slate-800 rounded-lg mb-8" />
            <div className="space-y-4">
              <div className="h-16 w-full bg-white/[0.02] rounded-2xl border border-white/5" />
              <div className="h-16 w-full bg-white/[0.02] rounded-2xl border border-white/5" />
            </div>
          </div>
        </div>

        {/* 右侧：AI 终端骨架 */}
        <div className="lg:col-span-2">
          <div className="bg-slate-950/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 h-[720px] flex flex-col">
            <div className="px-8 py-5 border-b border-white/5 flex justify-between">
              <div className="h-3 w-32 bg-slate-800 rounded-full" />
              <div className="h-3 w-12 bg-slate-800 rounded-full" />
            </div>
            <div className="px-8 py-5 border-b border-white/5">
              <div className="h-10 w-full bg-slate-900/50 rounded-xl" />
            </div>
            <div className="p-8 space-y-4 flex-1">
              <div className="h-3 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800 rounded" />
              <div className="h-3 w-2/3 bg-slate-800 rounded" />
              <div className="h-3 w-1/4 bg-slate-800 rounded" />
            </div>
            <div className="p-8 border-t border-white/5">
              <div className="h-14 w-full bg-slate-800 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
