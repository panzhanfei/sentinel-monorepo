// app/loading.tsx
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      {/* 这里的动画效果符合 32K 岗位的审美：简洁、专业 */}
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-500 font-medium animate-pulse">
        正在同步 Sentinel 安全数据...
      </p>
    </div>
  );
}
