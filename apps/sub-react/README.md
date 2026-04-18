# sub-react

Sentinel **审计子应用**：**React 19** + **Vite 7** + **Tailwind CSS 4**，默认端口 **3001**。由主应用 **Wujie** 嵌入；负责审计看板、任务与对话流展示，通过 **主域 BFF**（`/api`）访问后端。

---

## 职责

- **审计面板**：`views/AuditDashboard` — 概览卡片、足迹表、Agent 终端等（`components/audit`）。
- **BFF 调用**：`api/audit.ts`、`api/chatHistory.ts` 等；基址由 **`utils/bffOrigin.ts`** 的 `getBffBaseUrl()` 解析：
  - Wujie 注入的 `bffOrigin`；
  - 或环境变量 `VITE_BFF_ORIGIN`；
  - 开发环境下在 **3001** 访问时回退到 **`hostname:3000`**（配合 Vite 代理）。
- **开发代理**：`vite.config.ts` 将 **`/api`** 代理到 **`http://localhost:3000`**，并转发 **Cookie**，便于本地与主站会话一致。
- **状态**：`stores/wujie.ts` 等；列表虚拟化可使用 `@tanstack/react-virtual`。
- **路由（Wujie + 主站 `/audit/**`）**：
  - **`react-router-dom`**：`src/App/index.tsx` 中 `BrowserRouter`、`Routes`；页面使用 **`React.lazy` + `Suspense`** 做按需加载。
  - **路径桥接**：`src/App/WujieAuditPathSync.tsx` 监听宿主 **`react-sub-navigate`**，并在子应用路径变化时 **`bus.$emit('audit-react-sync-host', { path })`**。事件名字符串必须与 **`apps/main-next/lib/wujieAuditBus.ts`** 及 **`src/constants/wujieAuditBus.ts`** 保持一致。
  - **视图**：`/` → **`App/AuditHome.tsx`**（`useAppData` + `AuditDashboard` + 子路由测试链接）；`/wujie-sub-route-test` → **`views/WujieSubRouteTest`**；未匹配 → **`App/NoSubRouteMatch.tsx`**。

---

## 命令

```bash
pnpm --filter sub-react dev
pnpm --filter sub-react build
pnpm --filter sub-react run preview:host   # 0.0.0.0:3001，PM2 使用
pnpm --filter sub-react test
pnpm --filter sub-react lint
```

---

## 目录速览

| 路径 | 说明 |
|------|------|
| `src/views/AuditDashboard` | 审计主页面 |
| `src/App/index.tsx` | 根路由、`lazy`、`Suspense`、`WujieAuditPathSync` |
| `src/App/AuditHome.tsx` | 审计首页入口（仅在此挂载 `useAppData`） |
| `src/App/WujieAuditPathSync.tsx` | Wujie bus ↔ `react-router` |
| `src/constants/wujieAuditBus.ts` | 与 main-next 共用的 bus 事件名 |
| `src/views/WujieSubRouteTest` | 主站 `/audit/wujie-sub-route-test` 对照测试页 |
| `src/components/audit` | 审计 UI 组件 |
| `src/api` | BFF 请求封装 |
| `src/utils/bffOrigin.ts` | BFF 基址解析 |
| `src/utils/auditChat` | 聊天行构建与历史合并 |
| `src/hooks` | 会话初始化、审计控制等 |

---

## 相关文档

- 根目录 [README.md](../../README.md) — `NEXT_PUBLIC_WUJIE_REACT_URL` 与联调说明。
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — BFF、双 JWT、**文档第 7 节（Wujie 主子路由协同）**。
- [apps/main-next/README.md](../main-next/README.md) — Route Handlers、CORS、`AuditReactHost`。
