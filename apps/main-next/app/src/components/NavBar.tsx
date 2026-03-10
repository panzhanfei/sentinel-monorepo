"use client";

import React from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { TOSModal } from "@/app/src/components"; // 假设 TOSModal 已经是客户端组件

export function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            S
          </div>
          <span className="text-xl font-black tracking-tighter">SENTINEL</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
          <Link href="/docs#security" className="hover:text-white transition">
            Security
          </Link>
          <Link
            href="/docs"
            className="hover:text-white transition flex items-center gap-1"
          >
            Docs{" "}
            <span className="text-[10px] px-1 bg-white/10 rounded tracking-tighter text-indigo-400 font-bold border border-indigo-500/30">
              API
            </span>
          </Link>
          <Link
            href="https://github.com/panzhanfei/sentinel-monorepo"
            className="hover:text-white transition flex items-center gap-1"
          >
            <Github className="w-5 h-5 hover:text-white cursor-pointer transition" />
          </Link>
          <TOSModal />
        </div>
      </div>
    </nav>
  );
}
