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
  Layers,
  Radio,
  BookOpen,
  KeyRound,
} from "lucide-react";

const navItems = [
  { href: "#architecture", label: "Architecture" },
  { href: "#session", label: "Session & CORS" },
  { href: "#monorepo", label: "Monorepo" },
  { href: "#bff", label: "BFF API" },
  { href: "#microfrontends", label: "Micro-frontends" },
  { href: "#security", label: "Security Audit" },
  { href: "#ai", label: "AI Pipeline" },
  { href: "#setup", label: "Environment" },
  { href: "#ports", label: "Local ports" },
] as const;

const repoRows = [
  [
    "apps/main-next",
    "Next.js 16（App Router）、RainbowKit / wagmi、Wujie 宿主、BFF。httpOnly 双 JWT（accessToken + refreshToken）；middleware 校验受保护路由并对 /api 做子应用 Origin CORS（见 lib/subAppOrigins）。默认端口 3000。",
  ],
  ["apps/sub-react", "Vite + React 19 审计子应用，端口 3001；开发时 /api 代理到主应用。"],
  ["apps/sub-vue", "Vite + Vue 3 监控子应用，端口 3002。"],
  ["apps/server", "Express API + Bull Worker，默认 4000，前缀见 NODE_SERVICE。"],
  ["packages/database", "Prisma + PostgreSQL、Redis 客户端封装。"],
  ["packages/auth", "Nonce、JWT 等，供 server 与主应用引用。"],
  ["packages/security-sdk", "链上扫描与 ERC20 allowance 审计（viem）。"],
] as const;

const bffRows = [
  [
    "POST /api/auth/refresh",
    "将刷新请求代理到 Node `POST /auth/refresh`；按 `{ success, data }` 信封解析后写回 `accessToken` / `refreshToken` Cookie。",
  ],
  ["POST /api/scan", "创建扫描任务，双 JWT Cookie 转发至 Node `/scan`。"],
  ["GET /api/scan/stream", "SSE：`address`、`jobId` + Cookie，转发 Node 扫描日志流。"],
  ["GET /api/scan/latest", "按 `address` 查询最近任务；鉴权策略与同目录其他 scan 路由一致。"],
  ["GET /api/scan/[jobId]", "任务详情与进度，需双 JWT Cookie。"],
  ["POST /api/chat/session", "聊天会话，双 JWT Cookie 转发 Node。"],
  ["GET /api/chat/messages", "分页拉取会话消息（`sessionId`、`limit`、`before`），需双 JWT Cookie。"],
  [
    "GET /api/chat/stream",
    "SSE：sessionId、message；鉴权为 httpOnly 双 Cookie 或 `Authorization`（见 bffProxy `dualAuthUnauthorizedJson`）。",
  ],
  ["GET /api/events/watch", "链上 Transfer / Approval 等事件的 SSE，需 `NEXT_PUBLIC_RPC_URL`。"],
  ["GET /api/price", "CoinGecko 价格代理，可走 `HTTPS_PROXY`（默认 127.0.0.1:7897）。"],
  ["GET/PATCH /api/user/telegram-chat-id", "读写用户 Telegram Chat ID，双 JWT Cookie。"],
] as const;

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans scroll-smooth">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        <aside className="w-full md:w-72 p-8 md:sticky md:top-0 md:h-screen border-r border-slate-100 bg-slate-50/50 overflow-y-auto">
          <Link
            href="/"
            className="flex items-center gap-2 mb-10 text-indigo-600 font-bold hover:-translate-x-1 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <nav className="space-y-8">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">
                Navigation
              </h4>
              <ul className="space-y-2 text-sm font-semibold text-slate-600">
                {navItems.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition group"
                    >
                      {label}
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <a
                href="https://github.com/panzhanfei/sentinel-monorepo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
              >
                <BookOpen className="w-4 h-4" />
                Monorepo README
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8 md:p-20 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-100">
              v1.0.5-beta
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Updated: March 25, 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter text-slate-900 leading-tight">
            Sentinel Protocol <br />{" "}
            <span className="text-indigo-600">Technical Specifications</span>
          </h1>

          <div className="space-y-24">
            <section id="architecture" className="scroll-mt-24">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-600" /> Architecture
                Overview
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                Sentinel 采用异步任务架构：浏览器访问{" "}
                <strong className="text-slate-800">Next.js</strong> 主应用；扫描与
                AI 流水线由{" "}
                <strong className="text-slate-800">Express + Bull</strong>{" "}
                处理，<strong className="text-slate-800">Redis</strong>{" "}
                承载队列与 Pub/Sub（如{" "}
                <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">
                  job:{"{"}jobId{"}"}:log
                </code>
                ）；链上读取由{" "}
                <strong className="text-slate-800">viem</strong>{" "}
                在 Worker 与子应用中完成。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs">
                  <h3 className="font-bold mb-3 text-indigo-950">
                    Multicall 聚合
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    主应用侧可用 Wagmi 的{" "}
                    <code className="text-xs bg-white px-1 rounded border">
                      useReadContracts
                    </code>{" "}
                    在单次 RPC 中聚合多代币余额等读调用。
                  </p>
                </div>
                <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-xs">
                  <h3 className="font-bold mb-3 text-indigo-900">
                    数据与钩子分层
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    例如{" "}
                    <code className="text-xs bg-white/80 px-1 rounded border border-indigo-100">
                      useDashboardData
                    </code>{" "}
                    将仪表盘数据逻辑与展示组件解耦，便于测试与复用。
                  </p>
                </div>
              </div>
            </section>

            <section
              id="session"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <KeyRound className="w-6 h-6 text-indigo-600" />
                Session、中间件与 BFF CORS
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6 text-lg">
                登录态使用两个 <strong className="text-slate-800">httpOnly</strong>{" "}
                Cookie：<code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">
                  accessToken
                </code>{" "}
               （短期）与{" "}
                <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">
                  refreshToken
                </code>{" "}
                （长期）。<code className="text-sm bg-slate-100 px-1.5 rounded">
                  middleware.ts
                </code>{" "}
                仅在二者同时存在时视为已登录；受保护前缀与{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  lib/authRoutes.ts
                </code>{" "}
                对齐（如 <code className="text-xs bg-slate-100 px-1 rounded">/dashboard</code>、
                <code className="text-xs bg-slate-100 px-1 rounded">/monitor</code>、
                <code className="text-xs bg-slate-100 px-1 rounded">/audit</code>
                ）。Server Action 登录会清理旧版单 Cookie{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">token</code>。
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                对以{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">/api</code>{" "}
                开头的请求，中间件按{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  lib/subAppOrigins.ts
                </code>{" "}
                中的白名单（默认 localhost/127.0.0.1 的 3001、3002，外加环境变量覆盖）处理{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">OPTIONS</code>{" "}
                预检并下发{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  Access-Control-Allow-Credentials
                </code>
                ，使子应用可携带 Cookie 调用主域 BFF。Wujie 宿主在{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  WujieWrapper
                </code>{" "}
                中向子应用注入{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">bffOrigin</code>{" "}
                与{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">web3Data</code>
                ，并通过 Wujie <code className="text-xs bg-slate-100 px-1 rounded">bus</code>{" "}
                广播{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  web3-data-change
                </code>
                。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold mb-2 text-slate-800">Node 响应信封</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    BFF 使用{" "}
                    <code className="text-xs bg-white px-1 rounded border">
                      app/src/utils/nodeApiEnvelope.ts
                    </code>{" "}
                    等与{" "}
                    <code className="text-xs bg-white px-1 rounded border">
                      {"{ success, data }"}
                    </code>{" "}
                    /{" "}
                    <code className="text-xs bg-white px-1 rounded border">
                      {"{ success, error }"}
                    </code>{" "}
                    约定对齐 Node <code className="text-xs bg-white px-1 rounded">/api/v1</code>。
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <h3 className="font-bold mb-2 text-indigo-950">导航决策单测</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <code className="text-xs bg-white/80 px-1 rounded border border-indigo-100">
                      getMiddlewareAuthNavigation
                    </code>{" "}
                    与路由列表独立成模块，便于 Vitest 覆盖中间件行为而不依赖{" "}
                    <code className="text-xs bg-white/80 px-1 rounded border border-indigo-100">
                      NextResponse
                    </code>
                    。
                  </p>
                </div>
              </div>
            </section>

            <section
              id="monorepo"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Layers className="w-6 h-6 text-indigo-600" />
                Monorepo layout
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                仓库由 <strong>Turborepo</strong> + <strong>pnpm</strong>{" "}
                管理。根目录{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  docker-compose.yml
                </code>{" "}
                可一键起 PostgreSQL、Redis（及 RedisInsight）。
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">
                        Path
                      </th>
                      <th className="px-4 py-3 border-b border-slate-200">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {repoRows.map(([path, desc]) => (
                      <tr key={path} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs text-indigo-700 whitespace-nowrap">
                          {path}
                        </td>
                        <td className="px-4 py-3 leading-relaxed">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              id="bff"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Radio className="w-6 h-6 text-indigo-600" />
                Next.js BFF（app/api）
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                主应用将多数请求代理到 Node 基地址{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  NODE_SERVICE
                </code>
                （默认{" "}
                <code className="text-xs bg-slate-100 px-1 rounded break-all">
                  http://127.0.0.1:4000/api/v1
                </code>
                ），在服务端转发 httpOnly 双 JWT，并对上游 JSON 做解析与错误映射（见{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  bffProxy.ts
                </code>
                、
                <code className="text-xs bg-slate-100 px-1 rounded">
                  nodeApiEnvelope.ts
                </code>
                ），避免浏览器直连跨域与密钥暴露。
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">
                        Route
                      </th>
                      <th className="px-4 py-3 border-b border-slate-200">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 divide-y divide-slate-100">
                    {bffRows.map(([route, note]) => (
                      <tr key={route} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-xs text-indigo-700 whitespace-nowrap">
                          {route}
                        </td>
                        <td className="px-4 py-3 leading-relaxed">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              id="microfrontends"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Layers className="w-6 h-6 text-violet-600" />
                Wujie 微前端
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                主应用通过 <strong>Wujie（无界）</strong>嵌入子应用：审计面板对应{" "}
                <strong>React</strong>，监控面板对应 <strong>Vue</strong>。入口 URL 与 BFF
                CORS 白名单共用{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  lib/subAppOrigins.ts
                </code>
                ：默认{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  http://localhost:3001
                </code>{" "}
                /{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  http://localhost:3002
                </code>
                （含 127.0.0.1 变体），生产或自定义端口请设置{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  NEXT_PUBLIC_WUJIE_REACT_URL
                </code>
                、
                <code className="text-xs bg-slate-100 px-1 rounded">
                  NEXT_PUBLIC_WUJIE_VUE_URL
                </code>
                ，必要时用{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS
                </code>{" "}
               （逗号分隔）补充 CORS。控制台布局壳层为{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  app/(dashboard)/DashboardShell.tsx
                </code>
                。
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                全栈开发建议在仓库根执行{" "}
                <code className="bg-slate-100 px-1 rounded text-xs">
                  pnpm run dev
                </code>
                ，由 Turbo 并行拉起主应用与各子应用；子应用 dev 代理应指向主应用 origin，以便 Cookie 与 BFF 同源策略一致。
              </p>
            </section>

            <section
              id="security"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-600" /> Security & Audit
                Logic
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                审计输入来自 ERC20{" "}
                <code className="text-sm bg-slate-100 px-1.5 rounded">
                  allowance(owner, spender)
                </code>{" "}
                等链上数据：<strong>packages/security-sdk</strong> 与 Worker
                批量拉取后，可与黑名单、规则库比对；高风险场景可触发{" "}
                <strong>Telegram</strong> 告警（需配置 Bot 与用户 Chat ID）。
              </p>
              <div className="bg-slate-900 text-slate-300 p-8 rounded-3xl font-mono text-[13px] leading-relaxed shadow-2xl relative group overflow-x-auto">
                <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-100 transition">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <div className="text-indigo-400 mb-3">
                  <span className="opacity-50">{"// "}</span>
                  示意：读取授权并在有风险时发布频道消息（非唯一实现路径）
                </div>
                <pre className="whitespace-pre-wrap break-all">
                  {`const allowance = await usdcContract.read.allowance([
  user,
  riskyAddress,
]);
if (allowance > BigInt(0)) {
  await redis.publish("SECURITY_ALERT", riskyAddress);
}`}
                </pre>
              </div>
            </section>

            <section
              id="ai"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
                <Cpu className="w-6 h-6 text-indigo-600" /> AI audit pipeline
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Worker（<code className="text-xs bg-slate-100 px-1 rounded">
                  apps/server/src/workers/scanner.ts
                </code>
                ）在存在有效授权数据时依次执行：<strong>Scanner</strong>（初扫）
                → <strong>Auditor</strong>（复核）→{" "}
                <strong>Decision</strong>（Markdown 报告，正文需含{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  [RISK_LEVEL: HIGH/MEDIUM/LOW]
                </code>
                ）。当前主链路使用 <strong>DeepSeek</strong> 流式输出；环境变量校验见{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  env.config.ts
                </code>
                。
              </p>
              <div className="grid gap-4">
                {[
                  {
                    name: "Scanner",
                    role: "根据地址与授权 JSON 初扫，流式输出",
                  },
                  {
                    name: "Auditor",
                    role: "复核初扫结论，流式输出",
                  },
                  {
                    name: "Decision",
                    role: "最终 Markdown 报告与风险等级标注",
                  },
                  {
                    name: "Sidecar",
                    role: "Bull 任务状态、Redis 日志频道、可选 Telegram",
                  },
                ].map((agent, i) => (
                  <div
                    key={agent.name}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-5 bg-slate-50 rounded-2xl border border-slate-200/50 hover:bg-white hover:shadow-md transition"
                  >
                    <span className="font-bold text-slate-800">
                      Stage {i + 1} · {agent.name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium sm:text-right max-w-xl">
                      {agent.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="setup"
              className="pt-12 border-t border-slate-100 scroll-mt-24"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-slate-700" /> Environment Setup
              </h2>
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                    Node 服务（apps/server）
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    使用{" "}
                    <code className="bg-white px-1 rounded border">
                      .env.development
                    </code>{" "}
                    或{" "}
                    <code className="bg-white px-1 rounded border">
                      .env.production
                    </code>
                    。常用项：<code className="text-xs bg-white px-1 rounded">
                      REDIS_URL
                    </code>
                    、
                    <code className="text-xs bg-white px-1 rounded">
                      DATABASE_URL
                    </code>
                    、
                    <code className="text-xs bg-white px-1 rounded">
                      JWT_SECRET
                    </code>
                    、
                    <code className="text-xs bg-white px-1 rounded">
                      DEEPSEEK_API_KEY
                    </code>
                    、
                    <code className="text-xs bg-white px-1 rounded">
                      CORS_ORIGIN
                    </code>
                    （默认{" "}
                    <code className="text-xs">http://localhost:3000</code>）、
                    <code className="text-xs bg-white px-1 rounded">
                      ANVIL_RPC_URL
                    </code>
                    、可选{" "}
                    <code className="text-xs bg-white px-1 rounded">
                      TELEGRAM_BOT_TOKEN
                    </code>
                    。
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                    Next 主应用
                  </p>
                  <code className="block bg-white p-4 rounded-xl text-sm border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {`NODE_SERVICE=http://127.0.0.1:4000/api/v1
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...   # 建议与 JWT_SECRET 不同

# 子应用入口 + CORS（可选，默认本地 3001 / 3002）
# NEXT_PUBLIC_WUJIE_REACT_URL=https://react.example.com
# NEXT_PUBLIC_WUJIE_VUE_URL=https://vue.example.com
# NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS=https://a.com,https://b.com`}
                  </code>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    链上事件 SSE（<code className="bg-slate-100 px-1 rounded">
                      /api/events/watch
                    </code>
                    ）需要配置{" "}
                    <code className="bg-slate-100 px-1 rounded">
                      NEXT_PUBLIC_RPC_URL
                    </code>
                    。登录 Server Action（<code className="bg-slate-100 px-1 rounded">
                      actions/auth.ts
                    </code>
                    ）与 Node 刷新接口需与各自的 JWT / 刷新密钥配置一致。
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                    Mainnet fork（可选）
                  </p>
                  <code className="block bg-white p-4 rounded-xl text-sm border border-slate-200 overflow-x-auto">
                    anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
                  </code>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    本地分叉可读取主网状态；仓库根还提供{" "}
                    <code className="bg-slate-100 px-1 rounded">pnpm run node:fork</code>{" "}
                    等脚本（见根目录 README）。
                  </p>
                </div>
              </div>
            </section>

            <section
              id="ports"
              className="pt-12 border-t border-slate-100 scroll-mt-24 pb-20"
            >
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-slate-600" />
                Default local ports
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {[
                      ["Next.js 主应用", "3000"],
                      ["React 审计子应用", "3001"],
                      ["Vue 监控子应用", "3002"],
                      ["Express + Worker", "4000"],
                      ["RedisInsight（compose 映射）", "8001 → 5540"],
                    ].map(([name, port]) => (
                      <tr key={name} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {name}
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-700">
                          {port}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
