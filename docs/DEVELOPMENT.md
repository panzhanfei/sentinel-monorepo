# 开发约定与协作说明

本文档汇总仓库内 **编码规范、目录分层、测试与 E2E**，与根目录 [README.md](../README.md) 的快速开始配合使用。更细的**持久化规则**由 Cursor 读取：见 [`.cursor/rules/`](../.cursor/rules/) 下各 `*.mdc` 文件。

---

## 1. Cursor 规则索引（AI 与人工对齐）

| 文件 | 作用 |
|------|------|
| [`project-conventions.mdc`](../.cursor/rules/project-conventions.mdc) | 全仓库：`alwaysApply`。箭头函数、显式类型、`interface.ts` 与 **`I` + PascalCase** 命名、聚合导出（`index.ts`）、测试文件不进 barrel、新增业务前先查复用、`packages/` 共享能力。 |
| [`server-app.mdc`](../.cursor/rules/server-app.mdc) | `apps/server`：MVC 式分层（`routes` / `controllers` / `services` / `config` / `client` / `middlewares` / `modules` 等）。 |
| [`main-next-app.mdc`](../.cursor/rules/main-next-app.mdc) | `apps/main-next`：**`src/app`**（路由与 BFF）、**`src/*`** 共享模块、**`src/lib`**；**Next 16 渲染策略**与 **React 19 主壳侧**优化要点。 |
| [`sub-react-app.mdc`](../.cursor/rules/sub-react-app.mdc) | `apps/sub-react`：**React 19** 子应用；**懒加载、虚拟列表、transition** 等优先级说明。 |
| [`sub-vue-app.mdc`](../.cursor/rules/sub-vue-app.mdc) | `apps/sub-vue`：**Vue 3.5** 子应用；组合式 API、异步组件、性能相关约定；**hooks barrel 与 views 的循环依赖**注意点。 |

修改约定时优先更新对应 `*.mdc`，再视需要同步本节或根 README。

---

## 2. 全仓库约定（摘要）

- **函数**：默认箭头函数；导出 API、props、hook 返回值等边界处保持**显式类型**，避免 `any`。
- **类型与 `interface.ts`**：单文件类型过多时抽到同目录 **`interface.ts`**；对外具名类型使用 **`I` 前缀**（如 `IAgentTerminalProps`、`IAuditDashboardViewProps`）。存量代码可渐进迁移。
- **Barrel（`index.ts`）**：对外符号在对应目录 **`index.ts` 再导出**；**`.test.` / `.spec.`** 与仅测试用 helper **不要**进业务 barrel。
- **共享逻辑**：多应用可复用的能力优先放在 **`packages/*`**；新增业务前先检索是否已有可复用模块。
- **Monorepo workspace**：除 `apps/*`、`packages/*` 外，根目录 **`e2e/`** 为 Playwright 端到端包（见下文）。

---

## 3. `apps/main-next`：客户端导入限制（重要）

**`lib/index.ts`**（**`redis`**、**`authSession`**）与 **`lib/bffProxy.ts`**（依赖 **`authSession`**）属于**服务端 / BFF**；若在 **`"use client"`** 组件或仅浏览器运行的代码中写 **`import … from "@/lib"`**，易把 **ioredis** 等打进客户端依赖图，引发 **`Can't resolve 'tls'`** 等构建错误。

**正确做法**：

- 客户端从 **`@/utils/authFetch`**、**`@/components`**、**`@/hooks/...`**、**`@/config/...`**、**`@/proxy/authRoutes`**、**`@/wujie/...`** 等**具体路径**导入。
- **`app/api/*` Route Handler** 从 **`@/lib/bffProxy`** 使用 `dualAuthUnauthorizedJson`、`parseUpstreamJson` 等。

细节见 [`main-next-app.mdc`](../.cursor/rules/main-next-app.mdc)。

---

## 4. 各应用目录分层（速查）

- **`apps/server`**：`routes` → `controllers` → `services`；`config` / `client` / `middlewares` / `workers` / `modules` 等见 `server-app.mdc` 与 [apps/server/README.md](../apps/server/README.md)。
- **`apps/main-next`**：**`src/app`**（路由、`api` BFF、`actions`）；**`src/components`、`src/hooks`、`src/utils`、`src/types`**；**`src/config`**（`NODE_SERVICE`、`wagmi`、`contracts`）；**`src/wujie`**、**`src/proxy`**、**`src/proxy.ts`**（Next 入口）；**`src/lib`**（`authSession` / `redis` / **`bffProxy`**）；详见 [apps/main-next/README.md](../apps/main-next/README.md)。
- **`apps/sub-react`**：`views`、`components`、`hooks`、`services`、`stores`；`src/api` 为预留目录。
- **`apps/sub-vue`**：`views`、`components`、`router`、`stores`、`hooks`、`services`。

---

## 5. 测试

### 5.1 单元 / 集成测试（Vitest）

根目录执行：

```bash
pnpm test
```

Turbo 会并行运行各包中已声明的 `test` 脚本（如 `main-next`、`sub-react`、`sub-vue`、`server`、`@sentinel/auth` 等）。

### 5.2 端到端测试（Playwright）

包路径：**`e2e/`**（workspace 成员）。默认**自动拉起** `main-next` 开发服务后跑用例。

```bash
# 首次或 CI：安装 Chromium（在仓库根执行）
pnpm --filter e2e install:browsers

# 运行 E2E（根目录脚本）
pnpm e2e

# 调试 UI
pnpm e2e:ui
```

环境变量（可选）：

| 变量 | 含义 |
|------|------|
| `E2E_BASE_URL` | 被测站点 origin，默认 `http://127.0.0.1:3000` |
| `E2E_SKIP_WEB_SERVER=1` | 不自动起 Next，需已手动在对应地址运行 `main-next` |

报告与产物目录：`e2e/playwright-report/`、`e2e/test-results/`（已加入根 `.gitignore`）。

---

## 6. 与架构文档的关系

系统拓扑、BFF 流、微前端路由与 bus 约定见 [docs/ARCHITECTURE.md](./ARCHITECTURE.md)。本文档侧重**日常开发与规范**；架构文档侧重**运行时与数据流**。
