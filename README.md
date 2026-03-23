# Sentinel

Sentinel 是一个由 **Turborepo** + **pnpm** 管理的全栈 Monorepo，面向 Web3 场景：链上 ERC20 授权扫描、多阶段 AI 审计、任务队列与实时日志推送，以及基于 **Wujie（无界）** 的微前端壳应用整合 **Next.js**、**React** 与 **Vue** 子应用。

---

## 功能概览

- **链上授权审计**：通过 `@sentinel/security-sdk`（`viem`）批量拉取地址的 ERC20 `allowance` 数据，作为 AI 分析的输入。
- **多阶段 AI 流水线**：扫描（Scanner）→ 复核（Auditor）→ 决策与 Markdown 报告（Decision），当前实现基于 **DeepSeek** 流式输出；单阶段超时由心跳包装器监控并可自动重试。
- **异步任务与实时日志**：**Bull** 队列处理扫描任务；Worker 通过 **Redis Pub/Sub** 向频道 `job:{jobId}:log` 推送结构化日志，便于前端 SSE/轮询展示。
- **高危告警**：当最终评级为 `HIGH` 时，可经 **Telegram Bot** 向用户配置的 `telegramChatId` 推送摘要（需配置 `TELEGRAM_BOT_TOKEN` 与用户 Chat ID）。
- **微前端**：主应用 **Next.js** 内嵌 **Vite + React**（审计面板，默认 `http://localhost:3001`）与 **Vite + Vue**（监控面板，默认 `http://localhost:3002`）。
- **鉴权与数据**：**JWT**（`@sentinel/auth`）、**Prisma + PostgreSQL** 持久化用户、任务与聊天消息；Redis 用于队列、发布订阅及会话相关能力。

---

## 仓库结构

| 路径 | 说明 |
|------|------|
| `apps/main-next` | 主应用：**Next.js 16**（App Router）、RainbowKit / wagmi、Wujie 宿主、部分 **BFF** API（如转发 Node 服务、价格代理等）。默认开发端口 **3000**。 |
| `apps/sub-react` | 审计子应用：**Vite + React 19**，端口 **3001**；开发环境下 `/api` 代理到 `http://localhost:3000`。 |
| `apps/sub-vue` | 监控子应用：**Vite + Vue 3** + ECharts，端口 **3002**。 |
| `apps/server` | **Express** API 与 **Bull Worker**（`tsx watch` 开发）；默认端口 **4000**，路由前缀见 `NODE_SERVICE`（如 `http://127.0.0.1:4000/api/v1`）。 |
| `packages/database` | **Prisma** schema（PostgreSQL）、`@prisma/client` 与 Redis 客户端封装。 |
| `packages/auth` | 鉴权工具（Nonce、JWT 等），供 server 与主应用引用。 |
| `packages/security-sdk` | 链上扫描与授权审计逻辑（`viem`）。 |
| `packages/ui` | 共享 UI 组件包（`@repo/ui`）。 |
| `packages/eslint-config` / `packages/typescript-config` | 共享 ESLint 与 TS 配置（`@repo/*`）。 |

根目录 `docker-compose.yml` 提供 **PostgreSQL 15**、**Redis 7**（可配密码）及 **RedisInsight**（默认映射 `8001:5540`），便于本地一键起基础设施。

---

## 技术栈摘要

- **Monorepo**：Turborepo、pnpm 9、Node ≥ 18  
- **前端**：Next.js 16、React 19、Vue 3、Vite 7、Tailwind CSS 4、Wujie、wagmi / viem  
- **后端**：Express 5、Bull、ioredis、Prisma 6、Zod  
- **链上**：viem、本地可选用 **Anvil** 分叉（根脚本 `node:fork` / `start:demo`）

---

## AI 审计流水线（与代码一致）

Worker 逻辑位于 `apps/server/src/workers/scanner.ts`：

1. **链上数据**：`batchAuditAllowances` 拉取授权列表；若无有效授权则直接完成 job，跳过 LLM 调用。  
2. **Scanner（DeepSeek）**：根据地址与授权 JSON 做初扫，流式输出。  
3. **Auditor（DeepSeek）**：复核初扫结论，流式输出。  
4. **Decision（DeepSeek）**：生成最终 Markdown 报告，且正文中需包含 `[RISK_LEVEL: HIGH/MEDIUM/LOW]`；当前实现用是否包含 `HIGH` 字符串粗判风险等级。  
5. **可选 Telegram**：风险为 `HIGH` 时尝试向用户绑定 Chat ID 发告警。

> **说明**：`apps/server/src/config/env.config.ts` 中同时校验 **Gemini**、**Groq** 等 API Key（并导出 `ai.config`），主扫描链路当前以 **DeepSeek** 为主；部署时仍需按 schema 提供有效变量，否则进程无法在 Zod 校验阶段启动。

---

## 快速开始

### 1. 环境要求

- **Node.js** ≥ 18  
- **pnpm** 9（仓库指定 `packageManager`）  
- **Docker**（可选，用于 PostgreSQL / Redis）  
- 各 AI 与链上能力所需的 **API Key / RPC**（见下文环境变量）

### 2. 安装依赖

```bash
pnpm install
```

### 3. 基础设施（推荐）

在仓库根目录准备供 `docker-compose` 使用的变量（示例，请按本机修改）：

```bash
# 与 docker-compose.yml 中引用一致
DB_USER=sentinel
DB_PASSWORD=sentinel
DB_NAME=sentinel
DB_PORT=5432
REDIS_PASSWORD=your_redis_secret
REDIS_PORT=6379
```

启动：

```bash
pnpm run infra:up
```

查看日志：`pnpm run infra:logs`；停止：`pnpm run infra:down`。

### 4. 数据库与 Prisma

在 `packages/database` 目录执行（需已设置 `DATABASE_URL`，指向 PostgreSQL）：

```bash
cd packages/database
pnpm run db:generate
pnpm run db:push
```

`DATABASE_URL` 示例：

```text
postgresql://sentinel:sentinel@localhost:5432/sentinel
```

### 5. Node 服务环境变量

Server 从 **`apps/server` 工作目录**加载 **`.env.development`**（或 `.env.production`，由 `NODE_ENV` 决定），见 `apps/server/src/config/env.config.ts`。

**必填/常用项（节选）：**

| 变量 | 说明 |
|------|------|
| `PORT` | HTTP 端口，默认 `4000` |
| `REDIS_URL` | Redis 连接 URL（与 Docker 中密码、端口一致） |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | 至少 32 字符（生产环境务必替换默认值） |
| `DEEPSEEK_API_KEY` | DeepSeek API，扫描链路主用 |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | 当前 schema 要求非空；可按需填有效 Key 或后续收紧校验 |
| `CORS_ORIGIN` | 默认 `http://localhost:3000` |
| `ANVIL_RPC_URL` | 默认 `http://127.0.0.1:8545`，与本地分叉节点对齐 |
| `TELEGRAM_BOT_TOKEN` | 可选，启用 Telegram 告警 |

### 6. 主应用（Next.js）与微前端

主应用通过环境变量 **`NODE_SERVICE`** 指向 Node API 基地址，默认：

```text
NODE_SERVICE=http://127.0.0.1:4000/api/v1
```

微前端子应用 URL 在宿主页面中配置（如审计页使用 `http://localhost:3001`，监控页使用 `http://localhost:3002`），请与 Vite `server.port` 保持一致。

### 7. 一键开发

在仓库根目录：

```bash
pnpm run dev
```

Turbo 会并行启动各包中声明的 `dev` 任务（`main-next`、`sub-react`、`sub-vue`、`server` 等）。

**建议访问顺序**：先确保 PostgreSQL、Redis、`.env.development` 与 `DATABASE_URL` 就绪，再启动 `pnpm run dev`。

### 8. 本地链分叉（可选）

若需对接 QuickNode 分叉的本地 Anvil，可在根目录配置 `.env.local`（含 `QUICKNODE_RPC_URL`），然后：

```bash
pnpm run node:fork   # 启动 anvil
# 或等待分叉就绪后整体起服务：
pnpm run start:demo
```

---

## 常用脚本（根目录 `package.json`）

| 命令 | 作用 |
|------|------|
| `pnpm run dev` | Turbo 并行启动各应用 `dev` |
| `pnpm run build` | Turbo 构建 |
| `pnpm run lint` | 全仓库 lint |
| `pnpm run check-types` | TypeScript 检查 |
| `pnpm run format` | Prettier 格式化 `*.ts,*.tsx,*.md` |
| `pnpm run infra:up` / `infra:down` / `infra:logs` | Docker 基础设施 |

---

## 默认本地端口一览

| 服务 | 端口 |
|------|------|
| Next.js 主应用 | 3000 |
| React 审计子应用 | 3001 |
| Vue 监控子应用 | 3002 |
| Express API + Worker | 4000 |
| RedisInsight（compose） | 8001 → 容器内 5540 |

---

## 数据模型要点（Prisma）

定义见 `packages/database/schema.prisma`，主要包括：

- **User**：钱包地址、`telegramChatId` 等  
- **Job**：扫描任务类型、状态、进度、`result` JSON  
- **Blacklist**：风险地址黑名单  
- **ChatMessage**：按 `threadId` 聚合的多角色 Agent 对话流

---

## 文档与协作

- 代码风格与类型检查以各包内 ESLint / `tsc` 配置为准。  
- 修改 Prisma schema 后请重新执行 `db:generate`，并在团队流程中同步迁移策略（当前文档以 `db:push` 适合本地快速迭代为例）。

---

## 许可证

各子包如未单独声明许可证，请以仓库根目录或各 `package.json` 中的 `license` 字段为准。
