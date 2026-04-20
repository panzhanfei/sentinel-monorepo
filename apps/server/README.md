# server

Sentinel 的 **Express 5** API 与 **Bull** 扫描 Worker：对外前缀 **`/api/v1`**，与 **Next.js BFF**（`apps/main-next/src/app/api`）配合；浏览器不直连本服务写 Cookie，通常由 BFF 代理并转发 Cookie / 头。

分层与目录约定见 [docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md) 及 [`.cursor/rules/server-app.mdc`](../../.cursor/rules/server-app.mdc)。

---

## 职责

- **HTTP**：扫描任务、聊天流、用户（如 Telegram Chat ID）等 REST/SSE 端点。
- **Worker**：`src/workers/scanner.ts` 消费队列，执行链上拉数 + 多阶段 DeepSeek，可选 Telegram 高危告警。
- **进程模型**：`NODE_ENV=production` 时使用 **Node cluster**（主进程 fork，worker 内同时跑 HTTP + `startScan()`）；开发/测试为单进程，便于 `tsx watch` 调试。

---

## 本地开发

在 monorepo 根目录安装依赖后：

```bash
pnpm --filter server dev
```

默认监听 **`PORT`**（未设置时为 **4000**）。需已配置 **`apps/server/.env.development`**（或对应环境文件），且 **PostgreSQL / Redis** 可用；Prisma 见 `packages/database`。

构建与生产启动：

```bash
pnpm --filter server build
pnpm --filter server start
```

测试：

```bash
pnpm --filter server test
```

---

## 环境变量

校验与默认值见 **`src/config/env.config.ts`**（Zod）。常见项包括：

| 变量 | 说明 |
|------|------|
| `PORT` | HTTP 端口，默认 `4000` |
| `NODE_ENV` | `production` 时启用 cluster |
| `CLUSTER_WORKERS` | 可选，worker 数量；默认 `os.availableParallelism()` |
| `REDIS_URL` | Redis（Bull + Pub/Sub） |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | 与 BFF/登录一致；**生产**不得使用开发占位默认值（启动会校验失败） |
| `DEEPSEEK_API_KEY` | 审计流水线必填 |
| `DEEPSEEK_API_URL` | 可选 API 基地址 |
| `CORS_ORIGIN` | 逗号分隔的 Origin 白名单（须含协议）；配合 `credentials` |
| `TRUST_PROXY_HOPS` | 反代层数；生产在 Caddy 后建议 `1`，用于限流取真实 IP |
| `JSON_BODY_LIMIT` | `express.json` 单请求体上限，默认 `1mb` |
| `RATE_LIMIT_ENABLED` / `RATE_LIMIT_*` | 全局限流；**生产默认开**，开发/测试未设置时默认关；计数在 Redis |
| `TELEGRAM_BOT_TOKEN` | 可选，高危告警 |

数据库连接字符串由 **`@sentinel/database`** / Prisma 使用，通常通过 `DATABASE_URL` 注入。

---

## 路由约定

- 除 **`GET /api/v1`** 健康信息外，挂载在 **`/api/v1`** 下的业务路由均经过 **`authMiddleware`**：须同时提供有效 **Access** 与 **Refresh**，且 **`sub` 一致**。
- 路由模块：`routes/scan`、`routes/chat`、`routes/user`（扫描、对话、用户设置）。

更完整的端点表见仓库 **`docs/ARCHITECTURE.md`**。

---

## 与主站的关系

- 主站 **`NODE_SERVICE`** 指向本服务 API 根（例如 `http://127.0.0.1:4000/api/v1`）。
- 钱包登录、续签、写 HttpOnly Cookie 在 **Next** 完成；本服务只校验 JWT，不负责签发登录会话（签发逻辑在 `@sentinel/auth` + Next Server Actions / BFF）。
