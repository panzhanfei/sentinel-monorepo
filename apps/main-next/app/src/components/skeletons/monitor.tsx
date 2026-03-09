export function MonitorSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* 顶部三横排区块 */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
      {/* 中间四宫格资产分布 */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 border border-gray-100 rounded-2xl p-4 space-y-3"
          >
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
