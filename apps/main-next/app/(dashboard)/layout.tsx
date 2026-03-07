"use client";

import { useState } from "react";
import { SidebarNav, Web3ConnectKitButton } from "@/app/src/components";
import { Menu, X } from "lucide-react"; // 需要安装 lucide-react 或使用其他图标库

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:shadow-none
        `}
      >
        <div className="p-8 pb-4">
          <span className="text-xl font-extrabold tracking-tighter text-gray-900">
            SENTINEL
          </span>
        </div>

        <SidebarNav />

        <div className="p-4 border-t border-gray-50 mt-auto">
          <div className="px-4 py-2 text-xs text-gray-400 font-medium">
            v1.0.0-alpha
          </div>
        </div>
      </aside>

      {/* 侧边栏背景遮罩（移动端） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col h-full w-full md:w-auto overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-end px-4 md:px-8 items-center z-10">
          <Web3ConnectKitButton />
        </header>
        <div className="flex-1 overflow-auto bg-white/50 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
