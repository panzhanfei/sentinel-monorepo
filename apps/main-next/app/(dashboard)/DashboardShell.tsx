"use client";

import { useState } from "react";
import {
  SidebarNav,
  Web3ConnectKitButton,
  AlertProvider,
  TelegramChatIdSettings,
} from "@/app/src/components";
import { Menu, X } from "lucide-react";
import { RiskProvider } from "@/app/context";

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RiskProvider>
      {/* 1. 3D 背景层：必须位于最底层 */}
      <AlertProvider />

      <div className="flex h-screen overflow-hidden text-slate-200">
        {/* 移动端菜单按钮 */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 md:hidden bg-slate-800/80 p-2 rounded-full backdrop-blur-md border border-slate-700 shadow-xl"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* 2. 侧边栏：采用深色磨砂玻璃效果 */}
        <aside
          className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/40 backdrop-blur-xl border-r border-white/5 flex flex-col transform transition-transform duration-500 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0
        `}
        >
          <div className="p-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse" />
            <span className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
              SENTINEL
            </span>
          </div>

          <div className="flex-1 px-4">
            <SidebarNav />
          </div>

          <div className="p-6 mt-auto">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-800/50 to-transparent border border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Network Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-xs font-mono text-emerald-400">
                  Mainnet Live
                </span>
              </div>
            </div>
            <div className="mt-4 px-2 text-[10px] text-slate-600 font-mono italic">
              v1.0.0-alpha.rc1
            </div>
          </div>
        </aside>

        {/* 侧边栏遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 3. 主内容区域：透明背景，允许底层 3D 背景透出 */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* 顶部悬浮 Header */}
          <header className="h-20 flex justify-between items-center px-8 z-20">
            <div className="flex flex-col">
              <h2 className="text-sm font-medium text-slate-400">
                Security Terminal
              </h2>
              <p className="text-xs text-slate-600 font-mono">
                System.initialize_stream()...
              </p>
            </div>
            <div className="flex items-center gap-4">
              <TelegramChatIdSettings />
              <Web3ConnectKitButton />
            </div>
          </header>

          {/* 内容展示区：半透明容器 */}
          <div className="flex-1 overflow-auto px-4 md:px-8 pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto relative w-full h-full">
              {children}
            </div>
          </div>

          {/* 装饰性扫描线效果 */}
          <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </RiskProvider>
  );
}
