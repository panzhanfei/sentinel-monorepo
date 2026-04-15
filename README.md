# Sentinel

**Turborepo** + **pnpm** 管理的全栈 Monorepo：链上 ERC20 授权扫描、多阶段 AI 审计、异步任务与实时日志、高危告警，以及基于 **Wujie** 整合 **Next.js** / **React** / **Vue** 的微前端宿主。

---

## 项目背景

在 Web3 领域，用户将代币 **授权（approve）** 给恶意或不可信合约是资产损失的主要路径之一。多数工具仍停留在「列出授权」层面，难以对spender、额度与合约行为做连贯的风险判断。

**Sentinel** 通过 **多阶段 AI 审计** 消费链上授权数据，输出结构化结论与报告，并在识别到高危结果时支持 **实时告警**，目标是在授权侧为用户提供可行动的防护信号。

---

## 个人角色

本项目由本人 **独立设计、开发并完成部署**，覆盖：

- **微前端架构**：Wujie 宿主（Next.js）与子应用（React / Vue + Vite）的集成、路由与联调边界
- **全栈实现**：Node.js（Express API + Bull Worker）、PostgreSQL（Prisma）、Redis（队列与 Pub/Sub）
- **AI 工程化**：多角色 LLM 协作流水线、流式输出、超时与重试、能跳过无效链上输入以控制调用成本
- **生产级交付**：Docker Compose 编排依赖、配合 **Caddy** 与 **自建服务器** 完成对外访问与运维闭环

---

## 技术亮点

- **清晰分层**：共享包（`security-sdk`、`auth`、`database`）与多应用（宿主、子应用、API/Worker）拆分，链上逻辑、鉴权与持久化可复用、便于测试与演进。
- **长任务与实时 UI 解耦**：扫描走 **Bull**；Worker 经 **Redis Pub/Sub** 向 `job:{jobId}:log` 推送结构化日志，前端可 SSE/轮询展示进度与中间结果。
- **可扩展的微前端**：宿主承担统一入口；**全部 BFF** 由 **`apps/main-next`（Next）** 的 `app/api` 承担，子应用技术栈独立构建部署，由 Wujie 嵌入，降低后续并行迭代成本。
- **双 Token 与会话一致性**：Access + Refresh 分离签发与校验；受保护接口要求两者同时有效且 `sub` 一致；Next **`proxy.ts`**（Next.js 16 替代原 middleware）以双 Cookie 判定登录态，并配合 BFF 为子应用 Origin 开启 **CORS + credentials**，解决跨端口嵌入时的鉴权与刷新。

---

## 功能概览

- **链上授权审计**：`@sentinel/security-sdk`（`viem`）批量拉取地址的 ERC20 `allowance`，作为 AI 分析输入。
- **多阶段 AI 流水线**：扫描（Scanner）→ 复核（Auditor）→ 决策与 Markdown 报告（Decision）；三阶段均使用 **DeepSeek** 流式输出；单阶段超时由心跳包装器监控并可自动重试。
- **异步任务与实时日志**：**Bull** 处理扫描任务；Worker 通过 **Redis Pub/Sub** 向频道 `job:{jobId}:log` 推送结构化日志。
- **高危告警**：最终评级为 `HIGH` 时，可经 **Telegram Bot** 向用户配置的 `telegramChatId` 推送摘要（需 `TELEGRAM_BOT_TOKEN` 与用户 Chat ID）。
- **微前端**：主应用 **Next.js** 内嵌 **Vite + React**（审计面板，默认 `http://localhost:3001`）与 **Vite + Vue**（监控面板，默认 `http://localhost:3002`）。子应用入口与 **BFF `/api` 的 CORS 白名单** 由 `apps/main-next/lib/subAppOrigins.ts` 统一维护（默认本地 3001/3002，可通过 `NEXT_PUBLIC_WUJIE_*` 与 `NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS` 覆盖）。
- **鉴权与数据**：**双 JWT**（`DualJwtService`，`@sentinel/auth`）：登录后写入 HttpOnly Cookie **`accessToken`**（短期）与 **`refreshToken`**（长期），废弃旧单 Cookie `token`；Express 受保护路由从 **Authorization Bearer**、Cookie 或兼容字段读取 Access，Refresh 可从 Cookie、`X-Refresh-Token` 头或查询参数传入；Next 在 **BFF `/api/auth/refresh`** 完成本地续签并回写 Cookie，配合黑名单与单点登录控制。**Prisma + PostgreSQL**；Redis 用于队列、Pub/Sub、Nonce 限流与相关能力。

---

## 仓库结构

| 路径                                                    | 说明                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/main-next`                                        | 主应用：**Next.js 16**（App Router）、RainbowKit / wagmi、Wujie 宿主；**全部 BFF** 在本包 **`app/api`**（含 `/api/auth/refresh`）。**`proxy.ts`** 以双 Cookie 判定登录并对 `/api` 做子应用 **CORS**。端口 **3000**。生产为 **`output: "standalone"`**，发布产物经 **`pnpm --filter main-next run build:release`** 生成 **`apps/main-next/.release`**（见下文「生产部署：主站 Next.js」）。 |
| `apps/sub-react`                                        | 审计子应用：**Vite + React 19**，端口 **3001**；开发环境下 `/api` 代理到 `http://localhost:3000`；逻辑与 API 分层并含 Vitest 用例。          |
| `apps/sub-vue`                                          | 监控子应用：**Vite + Vue 3** + ECharts，端口 **3002**；监控逻辑拆分为 Store / Service / 图表模型与 Vitest 单测，视图以小组件组合。          |
| `apps/server`                                           | **Express** API 与 **Bull Worker**；**双 Token** 校验中间件（Access+Refresh、`sub` 一致）。默认 **4000**，前缀见 `NODE_SERVICE`。详见 **`apps/server/README.md`**。          |
| `packages/database`                                     | **Prisma** schema（PostgreSQL）、`@prisma/client` 与 Redis 客户端封装。                                                                     |
| `packages/auth`                                         | 鉴权工具：**Nonce**、**DualJwtService**（Access/Refresh 签发与校验）、幂等等；含 **Vitest** 单测。                                          |
| `packages/security-sdk`                                 | 链上扫描与授权审计逻辑（`viem`）。                                                                                                          |
| `packages/ui`                                           | 共享 UI（`@repo/ui`）。                                                                                                                     |
| `packages/eslint-config` / `packages/typescript-config` | 共享 ESLint 与 TS 配置（`@repo/*`）。                                                                                                       |

**架构拓扑、BFF 与 Express 端点索引**见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)（含 Mermaid 示意图，可与本 README 对照阅读）。

根目录 `docker-compose.yml` 提供 **PostgreSQL 15**、**Redis 7**、**RedisInsight**（默认映射 `8001:5540`）、可选 **Foundry Anvil**（仅 **JSON-RPC**，默认 `127.0.0.1:8545`→容器 `8545`；宿主机端口可用 `ANVIL_RPC_HOST_PORT` 覆盖；当前 `foundry` 镜像无独立 Web UI 端口），以及可选 **Caddy**（`--profile edge`）用于 **HTTPS 反代**。

### Caddy（HTTPS 与反代）

面向生产的典型安排：**云主机上** `docker compose` 起数据库与 Caddy，业务进程用 **PM2**（`pnpm run build` 后 `pnpm run pm2:start`）跑在宿主机；Caddy 容器通过 `host.docker.internal` 反代到 **Next `3000`** 等端口。

1. 根目录 `.env`（与 compose 共用）中设置 **`SENTINEL_DOMAIN`**，例如 `example.com`（不要带 `https://`）。DNS 已为 `@` / `www` 配置 **A 记录** 指向该主机。
2. **（可选）** 微前端需独立子域时：为 `react.example.com`、`vue.example.com` 增加解析，将 `caddy.d/20-microfe.caddy.example` **复制为** `caddy.d/20-microfe.caddy`，并把各应用的 **`NEXT_PUBLIC_WUJIE_*`**、`CORS_ORIGIN` 等改为对应的 `https://…`。
3. **（可选）** 在仓库根 **`Caddyfile`** 顶部增加全局块 `email your@example.com`，便于 Let’s Encrypt 续期通知。
4. 启动带边缘反代：`pnpm run infra:up:edge`（或 `docker compose --profile edge up -d`）。仅起数据库、不起 Caddy 时仍用 `pnpm run infra:up`。

国内若拉取 `caddy` 镜像较慢，可在 `.env` 中增加 `CADDY_IMAGE=docker.m.daocloud.io/library/caddy:2-alpine`（与其它镜像变量方式一致）。大陆网络下 Let's Encrypt HTTP-01 偶发失败时，可改为云厂商托管证书并在 `caddy.d` 中配置 `tls` 指令，详见 [Caddy 文档](https://caddyserver.com/docs/caddyfile/directives/tls)。

### 生产部署：主站 Next.js（standalone / PM2 / release-bot）

主站对外由 **Caddy** 反代到宿主机 **Next 监听端口（常见 `3000`）**；若 PM2 里进程处于 **errored** 或本机无进程监听该端口，会出现 **502**。常见根因之一是：把 **pnpm** 在 monorepo 里生成的 **`node_modules` 符号链接**原样同步到服务器，standalone 的 `server.js` 会 `require('next')`，链接指向构建机上的 `.pnpm` 路径，在目标机上不存在即报错 **`Cannot find module 'next'`**。

本仓库已做两件事：

1. **`apps/main-next/next.config.ts`**：`output: "standalone"`，并设置 **`outputFileTracingRoot`** 为 monorepo 根目录，便于在 workspace 下正确追踪依赖、稳定 standalone 目录结构。
2. **打包脚本**：`apps/main-next/scripts/pack-standalone.sh` 在 `next build` 之后，用 **`cp -R -L`** 将 standalone 应用目录、`static`、`public` 拷入 **`apps/main-next/.release`**（**跟随符号链接**，得到可 rsync 的真实文件树）。该目录已写入根目录 **`.gitignore`**，勿提交。

**本地或 CI 打发布包**（在仓库根目录，需已 `pnpm install`）：

```bash
pnpm --filter ./apps/main-next run build:release
```

等价于 `next build` 后执行上述 shell。日常仅验证构建、不需要 `.release` 时仍可用 `pnpm --filter main-next build`。

**配合 [release-bot](https://github.com/panzhanfei/release-bot) 等多模块发布工具时**，`main-next` 建议配置为：

- **`installCmd`**：`pnpm install --frozen-lockfile`（与其它模块一致，在发布仓根执行）
- **`buildCmd`**：`pnpm install --frozen-lockfile && pnpm --filter ./apps/main-next run build:release`（若发布流程已单独执行 install，可只保留 `pnpm --filter ./apps/main-next run build:release`）
- **`artifactPath`**：`apps/main-next/.release`（上传该目录内容到服务器上的部署目录，例如 `/root/srv/sentinel/main-next`）
- **`remoteRestartCmd`**：与现有 PM2 一致即可（例如以 `server.js` 为入口、`--cwd` 指向部署目录、`PORT=3000`）

不要使用仅 **`cp -R`（不跟 `-L`）** 从 `.next/standalone` 手工拼目录的旧方式，否则容易再次带上断链。

**若 release-bot 仍使用早期的长串 `buildCmd`（`cp` + `Desktop/...` + `test -f .release/server.js`），请删掉并改为 `build:release`。** 在启用 **`outputFileTracingRoot`** 后，Next 的 standalone 布局通常是 **`.next/standalone/apps/main-next/server.js`**：旧写法把 `standalone/*` 拷进 `.release` 时，`server.js` 会落在 **`.release/apps/main-next/server.js`**，根目录的 **`test -f apps/main-next/.release/server.js` 恒为假**，整条 shell **以非零退出**，release-bot 会报 `Command failed`。同时旧脚本用 **`cp -R` 不跟 `-L`** 仍会把 pnpm 断链带到线上。

下面 **`main-next` 键**可直接合并进 release-bot 的 **`RELEASE_MODULES_JSON`**（请按你的 `deployPath` / `remoteRestartCmd` 改路径；`remoteRestartCmd` 与下文示例一致时可原样使用）：

```json
"main-next": {
  "repoSubdir": "",
  "installCmd": "pnpm install --frozen-lockfile",
  "buildCmd": "pnpm install --frozen-lockfile && pnpm --filter ./apps/main-next run build:release",
  "artifactPath": "apps/main-next/.release",
  "deployPath": "/root/srv/sentinel/main-next",
  "remoteRestartCmd": "bash -lc \"export HOSTNAME=0.0.0.0 HOST=0.0.0.0 PORT=3000; pm2 delete sentinel-next 2>/dev/null || true; pm2 start /root/srv/sentinel/main-next/server.js --name sentinel-next --cwd /root/srv/sentinel/main-next\"",
  "rsyncDelete": false
}
```

若发布流程已在模块外执行过 **`pnpm install`**，可把 **`buildCmd`** 缩成：`pnpm --filter ./apps/main-next run build:release`。

更细的目录与脚本说明见 **`apps/main-next/README.md`**。

---

## 技术栈摘要

- **Monorepo**：Turborepo、pnpm 9、Node ≥ 18
- **前端**：Next.js 16、React 19、Vue 3、Vite 7、Tailwind CSS 4、Wujie、wagmi / viem
- **后端**：Express 5、Bull、ioredis、Prisma 6、Zod
- **链上**：viem；本地可选用 **Anvil** 分叉（根脚本 `node:fork` / `start:demo`）

---

## AI 审计流水线（与代码一致）

Worker 逻辑位于 `apps/server/src/workers/scanner.ts`：

1. **链上数据**：`batchAuditAllowances` 拉取授权列表；若无有效授权则直接完成 job，跳过 LLM 调用。
2. **Scanner（DeepSeek）**：根据地址与授权 JSON 做初扫，流式输出。
3. **Auditor（DeepSeek）**：复核初扫结论，流式输出。
4. **Decision（DeepSeek）**：生成最终 Markdown 报告，正文中需包含 `[RISK_LEVEL: HIGH/MEDIUM/LOW]`；当前实现用是否包含 `HIGH` 字符串粗判风险等级。
5. **可选 Telegram**：风险为 `HIGH` 时向用户绑定 Chat ID 发告警。

> **说明**：`apps/server/src/config/env.config.ts` 仅校验 **DeepSeek** 相关变量（`DEEPSEEK_API_KEY`、可选 `DEEPSEEK_API_URL`）及 Redis、JWT 等；部署时需按 schema 提供有效变量，否则进程无法在 Zod 校验阶段启动。

---

## 快速开始

### 1. 环境要求

- **Node.js** ≥ 18
- **pnpm** 9（仓库指定 `packageManager`）
- **Docker**（可选，用于 PostgreSQL / Redis）
- **DeepSeek API** 与链上能力所需的 **API Key / RPC**（见下文环境变量）

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

若 **`docker compose pull` 仍访问 `registry-1.docker.io` 失败**（超时、连接被拒绝等），可在同一 `.env` 中增加镜像前缀，经国内镜像站拉取（与官方镜像内容一致，仅注册表不同）：

```bash
POSTGRES_IMAGE=docker.m.daocloud.io/library/postgres:15-alpine
REDIS_IMAGE=docker.m.daocloud.io/library/redis:7-alpine
REDISINSIGHT_IMAGE=docker.m.daocloud.io/redislabs/redisinsight:latest
CADDY_IMAGE=docker.m.daocloud.io/library/caddy:2-alpine

# 使用 docker compose --profile edge 时必填（apex 域名，无协议）
# SENTINEL_DOMAIN=example.com
```

保存后执行 `docker compose pull` 再 `pnpm run infra:up`。若不需要 RedisInsight，可在 `docker-compose.yml` 中暂时注释 `redis-insight` 服务以少拉一个镜像。

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

若数据库仍是旧结构（`ChatSession` 与 `ChatMessage.sessionId`），在同步 schema 前于同一目录执行一次 `pnpm run db:migrate`。

`DATABASE_URL` 示例：

```text
postgresql://sentinel:sentinel@localhost:5432/sentinel
```

### 5. Node 服务环境变量

Server 从 **`apps/server` 工作目录**加载 **`.env.development`**（或 `.env.production`，由 `NODE_ENV` 决定），见 `apps/server/src/config/env.config.ts`。

**必填/常用项（节选）：**

| 变量                                  | 说明                                                  |
| ------------------------------------- | ----------------------------------------------------- |
| `PORT`                                | HTTP 端口，默认 `4000`                                |
| `REDIS_URL`                           | Redis 连接 URL（与 Docker 中密码、端口一致）          |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | Access / Refresh 各自密钥，至少 32 字符（生产务必替换默认值） |
| `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | 可选，默认 `15m` / `7d`，与宿主登录 Cookie `maxAge` 策略对齐 |
| `DEEPSEEK_API_KEY`                    | DeepSeek API，审计流水线必填                          |
| `DEEPSEEK_API_URL`                    | 可选，默认 `https://api.deepseek.com/v1`            |
| `CORS_ORIGIN`                         | 默认 `http://localhost:3000`                          |
| `ANVIL_RPC_URL`                       | 默认 `http://127.0.0.1:8545`，与本地分叉节点对齐      |
| `TELEGRAM_BOT_TOKEN`                  | 可选，启用 Telegram 告警                              |

### 6. 主应用（Next.js）与微前端

主应用通过环境变量 **`NODE_SERVICE`** 指向 Node API 基地址，默认：

```text
NODE_SERVICE=http://127.0.0.1:4000/api/v1
```

微前端子应用 URL 默认与 `subAppOrigins` 一致（审计 `http://localhost:3001`，监控 `http://localhost:3002`）；部署或改端口时请同时设置 **`NEXT_PUBLIC_WUJIE_REACT_URL`**、**`NEXT_PUBLIC_WUJIE_VUE_URL`**（必要时 **`NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS`**，逗号分隔），以便 Wujie 加载地址与 BFF CORS 白名单一致。**`proxy.ts`** 对 `/api` 的 **OPTIONS** 预检与响应会按上述白名单返回 `Access-Control-Allow-Credentials: true`，便于子应用 `fetch` 宿主 BFF 时携带 Cookie。

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

| 命令                                              | 作用                              |
| ------------------------------------------------- | --------------------------------- |
| `pnpm run dev`                                    | Turbo 并行启动各应用 `dev`        |
| `pnpm run build`                                  | Turbo 构建                        |
| `pnpm run lint`                                   | 全仓库 lint                       |
| `pnpm run check-types`                            | TypeScript 检查                   |
| `pnpm run format`                                 | Prettier 格式化 `*.ts,*.tsx,*.md` |
| `pnpm run test`                                   | Turbo 并行执行各包 `test`（Vitest，含 `auth`、`sub-react`、`sub-vue`、`main-next` 等） |
| `pnpm run infra:up` / `infra:down` / `infra:logs` | Docker 基础设施（DB、Redis、Anvil 等） |
| `pnpm run infra:up:edge`                          | 在上述基础上启动 **Caddy**（需配置 `SENTINEL_DOMAIN`） |

主站生产打包（生成可 rsync 的 **`.release`**，见上文「生产部署：主站 Next.js」）：

```bash
pnpm --filter ./apps/main-next run build:release
```

---

## 默认本地端口一览

| 服务                    | 端口               |
| ----------------------- | ------------------ |
| Next.js 主应用          | 3000               |
| React 审计子应用        | 3001               |
| Vue 监控子应用          | 3002               |
| Express API + Worker    | 4000               |
| RedisInsight（compose） | 8001 → 容器内 5540 |

---

## 数据模型要点（Prisma）

定义见 `packages/database/prisma/schema.prisma`，主要包括：

- **User**：钱包地址、`telegramChatId` 等
- **Job**：扫描任务类型、状态、进度、`result` JSON
- **Blacklist**：风险地址黑名单
- **ChatMessage**：按 `threadId` 聚合的多角色 Agent 对话流

---

## 开发与规范

代码风格与类型检查以各包内 ESLint / `tsc` 配置为准。修改 Prisma schema 后请重新执行 `db:generate`，并按环境选择 `db:push`（本地快速迭代）或迁移流程（生产）。

**单元测试**：根目录执行 `pnpm run test` 会通过 Turbo 跑通已声明 `test` 脚本的包；`@sentinel/auth` 与各微前端子包使用 **Vitest**，配置见各目录下的 `vitest.config.ts`。

---

## 许可证

各子包如未单独声明许可证，请以仓库根目录或各 `package.json` 中的 `license` 字段为准。
