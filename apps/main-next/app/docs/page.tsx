"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Code,
  Shield,
  Cpu,
  Activity,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans scroll-smooth">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        {/* 左侧侧边栏 */}
        <aside className="w-full md:w-72 p-8 md:sticky md:top-0 md:h-screen border-r border-slate-100 bg-slate-50/50">
          <Link
            href="/"
            className="flex items-center gap-2 mb-10 text-indigo-600 font-bold hover:translate-x-[-4px] transition-transform"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <nav className="space-y-8">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">
                Navigation
              </h4>
              <ul className="space-y-2 text-sm font-semibold text-slate-600">
                <li>
                  <a
                    href="#architecture"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition group"
                  >
                    Architecture{" "}
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="#security"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition group"
                  >
                    Security Audit{" "}
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="#ai"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition group"
                  >
                    AI Agent Protocol{" "}
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
                <li>
                  <a
                    href="#setup"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition group"
                  >
                    Environment Setup{" "}
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* 右侧主内容 */}
        <main className="flex-1 p-8 md:p-20 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-100">
              v1.0.4-beta
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Updated: March 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter text-slate-900 leading-tight">
            Sentinel Protocol <br />{" "}
            <span className="text-indigo-600">Technical Specifications</span>
          </h1>

          <div className="space-y-24">
            {/* 章节 1: 架构 */}
            <section id="architecture" className="scroll-mt-24">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-600" /> Architecture
                Overview
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                Sentinel 采用异步任务架构：前端通过 **Next.js**
                发起指令，任务状态由 **Redis** 队列中转，后端 **Node.js Worker**
                负责高频 RPC 链上扫描。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs">
                  <h3 className="font-bold mb-3 text-indigo-950">
                    Multicall 聚合
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    利用 Wagmi 的 `useReadContracts` 在单次 RPC
                    请求中聚合获取多链代币余额。
                  </p>
                </div>
                <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-xs">
                  <h3 className="font-bold mb-3 text-indigo-900">
                    Real-time Hook
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    `useDashboardData` 钩子实现了业务逻辑与 UI 组件的彻底解耦。
                  </p>
                </div>
              </div>
            </section>

            {/* 章节 2: Security (关键锚点) */}
            <section
              id="security"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-600" /> Security & Audit
                Logic
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                系统核心审计流程通过监听 `allowance(owner, spender)`
                事件实现。后端 Worker
                持续扫描，并将结果与内置的风险合约库进行毫秒级匹配。
              </p>
              <div className="bg-slate-900 text-slate-300 p-8 rounded-3xl font-mono text-[13px] leading-relaxed shadow-2xl relative group overflow-x-auto">
                <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-100 transition">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <p className="text-indigo-400 mb-2">
                  <p className="text-indigo-400 mb-2">
                    <span className="opacity-50">/{"/"}</span> 权限扫描算法核心
                    (Viem 驱动)
                  </p>
                </p>
                <p>
                  const allowance = await usdcContract.read.allowance([user,
                  riskyAddress]);
                </p>
                <p className="text-slate-300">
                  if (allowance &gt; BigInt(0)){" "}
                  <span className="text-indigo-400 font-bold">{"{"}</span>
                </p>

                <p className="pl-6 text-emerald-400">
                  await redis.publish(&apos;SECURITY_ALERT&apos;, riskyAddress);
                </p>
                <p>{"}"}</p>
              </div>
            </section>

            {/* 章节 3: AI 分工 */}
            <section
              id="ai"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
                <Cpu className="w-6 h-6 text-indigo-600" /> AI Agent Group
                Protocol
              </h2>
              <div className="grid gap-4">
                {[
                  {
                    name: "Collector",
                    role: "自动收集合约源码、持币历史及元数据",
                  },
                  {
                    name: "Auditor",
                    role: "基于 LLM 的漏洞识别与审计结果校验",
                  },
                  { name: "Reporter", role: "生成多语言结构化安全风险报告" },
                  {
                    name: "Supervisor",
                    role: "Agent 间心跳监测与容错切换 (Supervisor)",
                  },
                ].map((agent, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200/50 hover:bg-white hover:shadow-md transition"
                  >
                    <span className="font-bold text-slate-800">
                      AI-{i + 1} {agent.name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {agent.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 章节 4: 环境配置 */}
            <section
              id="setup"
              className="pt-12 border-t border-slate-100 scroll-mt-24 pb-20"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-slate-700" /> Environment Setup
              </h2>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                  Mainnet Fork Mode
                </p>
                <code className="block bg-white p-4 rounded-xl text-sm border border-slate-200 overflow-x-auto">
                  anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
                </code>
                <p className="text-xs text-slate-500 leading-relaxed">
                  通过 Fork 模式，Sentinel 可以在本地环境无缝读取主网 USDC
                  授权数据 (
                  <span className="font-mono bg-slate-100 px-1 rounded">
                    0xA0b8...
                  </span>
                  )。
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
