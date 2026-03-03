export function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6 animate-pulse">
      {/* 资产净值区骨架 */}
      <section className="space-y-4">
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="flex items-baseline gap-4">
          <div className="h-16 w-64 bg-slate-200 rounded-2xl"></div>
          <div className="h-8 w-20 bg-emerald-100 rounded-full"></div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主流资产构成骨架 */}
        <div className="lg:col-span-2 bg-white/50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
          <div className="h-6 w-40 bg-slate-200 rounded"></div>
          <div className="space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    <div className="h-3 w-32 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
                  <div className="h-3 w-12 bg-slate-100 rounded ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 安全审计骨架 */}
        <div className="bg-slate-800 p-8 rounded-[2rem] space-y-8">
          <div className="h-6 w-32 bg-slate-700 rounded"></div>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded-2xl border border-white/5"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
