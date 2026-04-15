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
| `src/components/audit` | 审计 UI 组件 |
| `src/api` | BFF 请求封装 |
| `src/utils/bffOrigin.ts` | BFF 基址解析 |
| `src/utils/auditChat` | 聊天行构建与历史合并 |
| `src/hooks` | 会话初始化、审计控制等 |

---

## 相关文档

- 根目录 [README.md](../../README.md) — `NEXT_PUBLIC_WUJIE_REACT_URL` 与联调说明。
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — BFF 与双 JWT 流程。
- [apps/main-next/README.md](../main-next/README.md) — Route Handlers 与 CORS。
