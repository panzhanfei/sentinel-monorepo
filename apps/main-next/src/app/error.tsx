"use client";

import { useEffect } from "react";

const Error = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    // 实际项目中这里通常会接入 Sentry 等日志系统
    console.error("Sentinel 运行时错误:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <svg
          className="w-12 h-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        安全层检测到异常
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        {error.message || "由于网络波动或鉴权失效，当前请求无法完成。"}
      </p>
      <button
        onClick={() => reset()} // 尝试重新渲染
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
      >
        尝试恢复连接
      </button>
    </div>
  );
};
export default Error
