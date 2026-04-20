# main-next

Sentinel 主应用：基于 **Next.js App Router** 的壳层；源码在 **`src/`**（**`src/app`** 为路由与 BFF）。**当前仓库内全部 BFF** 由 **`src/app/api`** 承担（登录态、受保护路由、对 Node 服务的 API 代理），并通过 **Wujie** 嵌入 React / Vue 子应用。路径别名 **`@/*` → `src/*`**。

## 技术栈

- Next.js 16、React 19
- Wagmi / RainbowKit / ConnectKit（Web3）
- Wujie（微前端）
- 工作区内 `@sentinel/auth`（双 JWT：`accessToken` + `refreshToken`）

## 目录速览

| 路径                                  | 说明                                                                |
| ------------------------------------- | ------------------------------------------------------------------- |
| `next.config.ts`                      | `output: "standalone"`；`outputFileTracingRoot` 指向 monorepo 根，便于 workspace 依赖追踪 |
| `scripts/pack-standalone.sh`         | `next build` 后将 standalone + `static` + `public` 解引用拷贝到 **`.release/`**（避免 pnpm 符号链接在部署机断裂） |
| `src/proxy.ts`                        | **Next 16 约定**：请求拦截入口（原 `middleware.ts`）；实现见 **`src/proxy/runProxy.ts`**；`config.matcher` 须在本文件字面量导出 |
| `src/proxy/middlewareAuthNavigation.ts` | 导航决策（与 `NextResponse` 解耦，便于单测） |
| `src/proxy/authRoutes.ts`             | 受保护路由前缀（与 AuthGuard、`runProxy` 共用） |
| `src/wujie/subAppOrigins.ts`          | `resolveWujieSubAppBases(host)`（按请求 Host 选子应用源）与 BFF CORS 白名单 |
| `src/app/actions/auth.ts`             | Server Actions（`"use server"`）：nonce、签名登录、写 Cookie、登出 |
| `src/app/api/**`                      | Route Handlers（BFF），含本地 `auth/refresh` 续签与会话校验 |
| `src/lib/bffProxy.ts`                 | BFF：双 Token 校验、转发头、`parseUpstreamJson`（仅服务端引用） |
| `src/utils/authFetch.ts`              | 浏览器同源 BFF 请求（401 可刷新重试） |
| `src/config/`                         | `NODE_SERVICE`、`wagmi`、`contracts` 等 |
| `src/components/`、`src/hooks/`       | 跨路由 **`"use client"`** 组件与 hook |
| `src/app/(dashboard)/DashboardShell.tsx` | 控制台壳（侧栏、Risk/Alert、Telegram 设置等） |
| `src/app/(dashboard)/layout.tsx`      | 薄布局，仅挂载 `DashboardShell` |
| `src/wujie/WujieWrapper.tsx`          | 动态加载 Wujie，向子应用注入 `bffOrigin`、`web3Data` 等 |
| `src/wujie/AuditReactHost.tsx`        | 审计子应用壳：`/audit/**` |
| `src/wujie/MonitorVueHost.tsx`        | 监控子应用壳：`/monitor/**` |
| `src/wujie/wujieAuditBus.ts`          | 审计：路径解析 + bus 事件名（与 sub-react 一致） |
| `src/wujie/wujieMonitorBus.ts`        | 监控：同上（与 sub-vue 一致） |
| `src/app/(dashboard)/audit/layout.tsx`、`monitor/layout.tsx` | 持久挂载对应 Host |
| `src/app/(dashboard)/audit/[[...slug]]/page.tsx` 等 | 占位页，承接 `/audit/*`、`/monitor/*` |

## 环境变量

与子应用地址和跨域相关的变量在 `src/wujie/subAppOrigins.ts` 中集中使用：

- `NEXT_PUBLIC_WUJIE_REACT_URL`：React 子应用完整源（默认 `http://localhost:3001`）
- `NEXT_PUBLIC_WUJIE_VUE_URL`：Vue 子应用完整源（默认 `http://localhost:3002`）
- `NEXT_PUBLIC_WUJIE_EXTRA_ORIGINS`：额外允许的源，逗号分隔（并入 CORS 白名单）
- `NEXT_PUBLIC_WUJIE_USE_PRODUCTION_SUBAPPS`：设为 `true` 时始终使用上述 WUJIE URL（含在 localhost 上强开生产子域调试）
- 子应用 iframe 基址由 **Server Layout** 根据 `headers().get('host')` 调用 `resolveWujieSubAppBases`：访问 `localhost` / `127.0.0.1` 时固定本机 3001/3002，避免 `next start` 或 `NODE_ENV=production` 仍误用 `.env` 里的生产子域

登录与 JWT（见 `src/app/actions/auth.ts`）：

- `JWT_SECRET`、`REFRESH_TOKEN_SECRET`（可选，有默认值仅用于开发）
- `JWT_EXPIRES_IN`、`REFRESH_TOKEN_EXPIRES_IN`（可选）

Node BFF 上游地址见 `src/config/node_service.ts`（`NODE_SERVICE` 等）。

## 认证与会话

- 会话以 **httpOnly Cookie** 保存：`accessToken`（短期）与 `refreshToken`（长期）。**`src/proxy.ts`** 将 **两者同时存在** 视为已登录。
- 登录成功后 Server Action 会删除旧版单 Cookie `token`，避免混用。
- 受保护路径前缀定义在 `src/proxy/authRoutes.ts`（如 `/dashboard`、`/monitor`、`/audit`）。未登录访问会重定向到 `/login`，并带 `from` 查询参数便于回跳；已登录访问 `/login` 会重定向到 `/dashboard`。

## BFF 与 Node 服务

子应用与浏览器侧 **不实现 BFF**：统一走主域 **`/api/*`**（本包 Route Handlers），再转发至 Express（`NODE_SERVICE`）。

- `src/app/api/auth/refresh/route.ts` 在 BFF 内完成双 Token 校验与旋转续签，刷新两个 Cookie 的 `maxAge`（与登录策略一致）。
- 其他 BFF 路由应复用 `parseUpstreamJson`、`proxyHeadersToNode` 等与 Node 的约定（见 `src/lib/bffProxy.ts`）。

## 微前端与跨域

- 子应用 iframe 入口使用 `WUJIE_SUB_APP_URL`（`subAppOrigins.ts`），与 CORS 白名单 `BFF_CORS_ORIGIN_SET` 同源配置，避免多处硬编码不一致。
- **`src/proxy.ts`** 对 `/api` 请求：非白名单 Origin 的 `OPTIONS` 返回 204 且无 CORS 头；白名单来源则允许 `credentials`，便于子应用携带 Cookie 调用主域 BFF。
- `WujieClient` 通过 props 传入 `bffOrigin`（当前页 `window.location.origin`），子应用可据此构造同源 BFF 请求；`useWeb3Sync`（`wujieHooks.tsx`）通过 Wujie `bus` 广播 `web3-data-change`，与子应用联动。

### 主子路由协同（Wujie 子应用 vs Next App Router）

完整设计、数据流与「为何不默认用 Wujie `sync`」见仓库 **[docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) 第 7 节**。

摘要：

- 主站展示 **`/audit/**`、`/monitor/**`** 路径；子应用内为 **Vite SPA**（`react-router` / `vue-router`）。保活模式下靠 **Wujie `bus`** 双向同步，审计/监控嵌入页使用 **`sync={false}`**，避免子路由被写进 `?子应用名=` 查询参数。
- **`AuditReactHost` / `MonitorVueHost`**：用 **`useState` 初始化一次** iframe 入口 URL（支持深链首屏），之后只 **`bus.$emit`** 子路径，不反复改 `url`，减少 iframe 重载。
- **Host 放在 `audit/layout.tsx`、`monitor/layout.tsx`**，不要放在 `[[...slug]]/page.tsx` 内，否则 slug 变化会导致 **page 重挂载**、`WujieClient` 再次显示 **AuditSkeleton / MonitorSkeleton**。

## 本地开发

在 monorepo 根目录安装依赖后，于本包执行：

```bash
pnpm --filter main-next dev
```

默认主应用端口以 Next 为准（常见为 `http://localhost:3000`）；请与子应用、Node 服务的端口及上述环境变量一致。

## 生产构建与部署（standalone）

本应用以 **Next.js standalone** 方式运行：生产环境只需要 `.release` 内的 `server.js`、`node_modules`、`.next/static`、`public` 等，由 **Node** 直接启动（常见配合 **PM2**，由前置 **Caddy** 反代到 `PORT`，默认 **3000**）。

### 为何需要 `build:release`

Monorepo 使用 **pnpm** 时，`.next/standalone` 里的 `node_modules` 往往是指向仓库根 `.pnpm` 的**符号链接**。若用普通 `cp -R` 同步到另一台机器，链接目标不存在，进程会 **`Cannot find module 'next'`**。因此发布前应用 **`pack-standalone.sh`**：通过 **`cp -R -L`** 跟随链接，把依赖展开成**真实文件**。

### 命令

在 **monorepo 根目录**（推荐，与 filter 一致）：

```bash
pnpm --filter ./apps/main-next run build:release
```

- 等价于：`next build` → `bash ./scripts/pack-standalone.sh`
- 产出目录：**`apps/main-next/.release/`**（根 `.gitignore` 已忽略，勿提交）
- 仅需要 `.next`、不打包发布时：`pnpm --filter main-next build`

### release-bot（或其它发布工具）配置要点

将 **`artifactPath`** 设为 **`apps/main-next/.release`**；**`buildCmd`** 中调用上述 **`build:release`**，**不要**再用冗长的手工 `cp` 链从 `.next/standalone` 拼目录。根 **`README.md`** 同节附有 **`RELEASE_MODULES_JSON` 里 `main-next` 的 JSON 示例**，可直接合并进 release-bot。

旧脚本里若包含 **`test -f apps/main-next/.release/server.js`**：在 **`outputFileTracingRoot`** 生效后，`server.js` 常在 **`.next/standalone/apps/main-next/`**，粗拷贝会得到 **`.release/apps/main-next/server.js`**，根目录 **`server.js` 不存在**，该 **`test` 失败会导致整条 `buildCmd` 非零退出**（release-bot 报 `Command failed`）。

## 测试

### Vitest（本包）

```bash
pnpm --filter main-next test
```

`src/proxy/*`、`src/wujie/*`、`src/lib/*.test.ts` 等可在本包 Vitest 中运行。

### 端到端（仓库 `e2e/`）

全仓库 Playwright 用例默认针对 **`http://127.0.0.1:3000`** 拉起本应用。在 monorepo 根目录：

```bash
pnpm --filter e2e install:browsers   # 首次或 CI
pnpm e2e
```

环境变量 `E2E_SKIP_WEB_SERVER=1` 时不会自动起服务（需已手动 `pnpm --filter main-next dev`）。详见根目录 [docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md)。

### 客户端模块导入（避免 Redis 进入浏览器打包）

**`"use client"` 组件**（及仅浏览器运行的代码）**不要**使用：

- `import … from "@/lib"`（会打入 Redis；请用 **`@/utils/authFetch`**、**`@/components`**、**`@/hooks/...`**、**`@/wujie/*`**、**`@/proxy/authRoutes`** 等具体路径）

否则可能将 `authSession` / **ioredis** 拉入客户端依赖图。**Route Handlers（`src/app/api/*`）** 从 **`@/lib/bffProxy`** 导入 `dualAuthUnauthorizedJson`、`parseUpstreamJson` 等。

约定与 Cursor 规则见 [docs/DEVELOPMENT.md](../../docs/DEVELOPMENT.md) 与 [`.cursor/rules/main-next-app.mdc`](../../.cursor/rules/main-next-app.mdc)。

---

更多通用 Next.js 说明见 [Next.js 文档](https://nextjs.org/docs)。
