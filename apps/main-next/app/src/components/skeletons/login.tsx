"use client";

import { ShieldCheck } from "lucide-react";

export const LoginSkeleton = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-black p-4">
      <div className="w-full max-w-md">
        {/* 顶部 Logo 骨架 */}
        <div className="flex justify-center mb-8 animate-pulse">
          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 backdrop-blur-xl">
            <ShieldCheck className="w-12 h-12 text-slate-700" />
          </div>
        </div>

        {/* 主卡片骨架 */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 p-8 rounded-3xl shadow-2xl space-y-8">
          <div className="text-center space-y-3">
            {/* 标题骨架 */}
            <div className="h-8 bg-slate-800/50 rounded-lg w-1/3 mx-auto animate-pulse" />
            {/* 副标题骨架 */}
            <div className="h-4 bg-slate-800/30 rounded-md w-2/3 mx-auto animate-pulse" />
          </div>

          <div className="space-y-6">
            {/* 按钮区域骨架 */}
            <div className="flex justify-center">
              <div className="h-12 w-48 bg-slate-800/50 rounded-full animate-pulse" />
            </div>

            {/* 操作按钮骨架 */}
            <div className="h-14 bg-blue-900/20 border border-blue-500/10 rounded-xl w-full animate-pulse" />

            {/* 底部链接骨架 */}
            <div className="h-4 bg-slate-800/30 rounded-md w-1/4 mx-auto animate-pulse" />
          </div>
        </div>

        {/* 页脚骨架 */}
        <div className="mt-8 h-3 bg-slate-800/20 rounded-full w-1/2 mx-auto animate-pulse" />
      </div>
    </div>
  );
};
