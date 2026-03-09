export function AuditSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* 顶部两个大卡片 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="h-40 bg-gray-50 border border-gray-100 rounded-3xl p-6">
          <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
          <div className="h-12 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-40 bg-gray-50 border border-gray-100 rounded-3xl p-6">
          <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
          <div className="h-12 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      {/* 底部历史足迹大列表 */}
      <div className="h-64 bg-gray-50 border border-gray-100 rounded-3xl" />
    </div>
  );
}
