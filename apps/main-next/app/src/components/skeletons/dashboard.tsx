export function DashboardSkeleton() {
  // 核心呼吸样式：深色底，极低透明度波动
  const pulseClass = "animate-pulse bg-zinc-900/50 border border-white/5";
  const innerBlock = "bg-zinc-800/40 rounded-lg";

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-8 font-mono overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* --- 1. 资产净值区 (Net Worth Section) --- */}
        <section className="space-y-6 border-l-2 border-indigo-500/20 pl-8">
          <div className={`h-4 w-40 ${innerBlock}`} />{" "}
          {/* "TOTAL_NET_WORTH" 标签 */}
          <div className="flex items-end gap-6">
            <div className={`h-20 w-80 rounded-4xl ${pulseClass}`} />{" "}
            {/* 巨额数字占位 */}
            <div
              className={`h-10 w-28 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse`}
            />{" "}
            {/* 百分比涨跌占位 */}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* --- 2. 主流资产构成 (Assets List) --- */}
          <div
            className={`lg:col-span-2 p-10 rounded-[3.5rem] space-y-8 ${pulseClass}`}
          >
            <div className="flex justify-between items-center">
              <div className={`h-6 w-48 ${innerBlock}`} />{" "}
              {/* "ASSET_DISTRIBUTION" */}
              <div className={`h-8 w-8 rounded-full ${innerBlock}`} />
            </div>

            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-6 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-zinc-800/60 animate-pulse`}
                    />{" "}
                    {/* Token Logo */}
                    <div className="space-y-3">
                      <div className={`h-5 w-24 ${innerBlock}`} />{" "}
                      {/* Token Name */}
                      <div className={`h-3 w-40 bg-zinc-800/20 rounded`} />{" "}
                      {/* Address/Network */}
                    </div>
                  </div>
                  <div className="space-y-3 text-right">
                    <div className={`h-5 w-28 ${innerBlock} ml-auto`} />{" "}
                    {/* Balance Amount */}
                    <div
                      className={`h-3 w-16 bg-zinc-800/20 rounded ml-auto`}
                    />{" "}
                    {/* USD Value */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- 3. 安全审计面板 (Security Audit Panel) --- */}
          <div className="bg-gradient-to-b from-zinc-900/80 to-black p-10 rounded-[3.5rem] border border-white/10 space-y-10 relative overflow-hidden">
            {/* 顶部的“雷达”扫描感占位 */}
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
              <div className={`h-6 w-32 ${innerBlock} bg-rose-500/10`} />
            </div>

            <div className="space-y-8">
              {[1, 2, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between">
                    <div className={`h-4 w-3/4 ${innerBlock} bg-zinc-800/80`} />
                    <div className={`h-4 w-8 ${innerBlock} bg-zinc-700`} />
                  </div>
                  {/* 进度条占位 */}
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-zinc-700 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* 底部装饰性按钮占位 */}
            <div
              className={`mt-10 h-14 w-full rounded-2xl bg-indigo-500/5 border border-indigo-500/20 animate-pulse`}
            />

            {/* 背景装饰光晕 */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/5 blur-[100px] pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
