# main-next

Sentinel 主应用：基于 **Next.js App Router** 的壳层与 BFF，负责登录态、受保护路由、对 Node 服务的 API 代理，以及通过 **Wujie** 嵌入 React / Vue 子应用。

## 技术栈

- Next.js 16、React 19
- Wagmi / RainbowKit / ConnectKit（Web3）
- Wujie（微前端）
- 工作区内 `@sentinel/auth`（双 JWT：`accessToken` + `refreshToken`）

## 目录速览

| 路径                                  | 说明                                                                |
| ------------------------------------- | ------------------------------------------------------------------- |
| `middleware.ts`                       | 全站中间件：`/api` 的 CORS；页面请求的会话检查与登录重定向          |
| `lib/middlewareAuthNavigation.ts`     | 中间件导航决策（与 `NextResponse` 解耦，便于单测）                  |
| `lib/authRoutes.ts`                   | 受保护路由前缀（与 AuthGuard 共用）                                 |
| `lib/subAppOrigins.ts`                | 子应用入口 URL 与 BFF CORS 白名单（单一数据源）                     |
| `actions/auth.ts`                     | Server Actions：nonce、签名登录、写 Cookie、登出                    |
| `app/api/**`                          | Route Handlers（BFF），含本地 `auth/refresh` 续签与会话校验          |
| `app/src/utils/nodeApiEnvelope.ts`    | 解析 Node `/api/v1` 风格 `{ success, data }` / `{ success, error }` |
| `app/(dashboard)/DashboardShell.tsx`  | 控制台壳（侧栏、Risk/Alert、Telegram 设置等，Client Component）     |
| `app/(dashboard)/layout.tsx`          | 薄布局，仅挂载 `DashboardShell`                                     |
| `app/src/components/WujieWrapper.tsx` | 动态加载 Wujie，向子应用注入 `bffOrigin`、`web3Data` 等             |

## 环境变量

与子应用地址和跨域相关的变量在 `lib/subAppOrigins.ts` 中集中使用：

- `NEXT_PUBLIC_WUJIE_REACT_URL`：React 子应用完整源（默认 `http://localhost:3001`）
- `NEXT_PUBLIC_WUJIE_VUE_URL`：Vue 子应用完整源（默认 `http://localhost:3002`）
- `NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS`：额外允许的源，逗号分隔（并入 CORS 白名单）

登录与 JWT（见 `actions/auth.ts`）：

- `JWT_SECRET`、`REFRESH_TOKEN_SECRET`（可选，有默认值仅用于开发）
- `JWT_EXPIRES_IN`、`REFRESH_TOKEN_EXPIRES_IN`（可选）

Node BFF 上游地址见 `app/src/config/node_service`（`NODE_SERVICE` 等）。

## 认证与会话

- 会话以 **httpOnly Cookie** 保存：`accessToken`（短期）与 `refreshToken`（长期）。中间件将 **两者同时存在** 视为已登录（`middleware.ts`）。
- 登录成功后 Server Action 会删除旧版单 Cookie `token`，避免混用。
- 受保护路径前缀定义在 `lib/authRoutes.ts`（如 `/dashboard`、`/monitor`、`/audit`）。未登录访问会重定向到 `/login`，并带 `from` 查询参数便于回跳；已登录访问 `/login` 会重定向到 `/dashboard`。

## BFF 与 Node 服务

- `app/api/auth/refresh/route.ts` 在 BFF 内完成双 Token 校验与旋转续签，刷新两个 Cookie 的 `maxAge`（与登录策略一致）。
- 其他 BFF 路由应复用 `parseUpstreamJson`、`proxyHeadersToNode` 等与 Node 的约定（见 `app/src/utils/bffProxy.ts`）。

## 微前端与跨域

- 子应用 iframe 入口使用 `WUJIE_SUB_APP_URL`（`subAppOrigins.ts`），与 CORS 白名单 `BFF_CORS_ORIGIN_SET` 同源配置，避免多处硬编码不一致。
- `middleware` 对 `/api` 请求：非白名单 Origin 的 `OPTIONS` 返回 204 且无 CORS 头；白名单来源则允许 `credentials`，便于子应用携带 Cookie 调用主域 BFF。
- `WujieClient` 通过 props 传入 `bffOrigin`（当前页 `window.location.origin`），子应用可据此构造同源 BFF 请求；`useWeb3Sync`（`wujieHooks.tsx`）通过 Wujie `bus` 广播 `web3-data-change`，与子应用联动。

## 本地开发

在 monorepo 根目录安装依赖后，于本包执行：

```bash
pnpm --filter main-next dev
```

默认主应用端口以 Next 为准（常见为 `http://localhost:3000`）；请与子应用、Node 服务的端口及上述环境变量一致。

## 测试

```bash
pnpm --filter main-next test
```

`lib/middlewareAuthNavigation` 等逻辑配有 Vitest 用例时可在此目录下运行。

---

更多通用 Next.js 说明见 [Next.js 文档](https://nextjs.org/docs)。
