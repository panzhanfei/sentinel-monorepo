# sub-vue

Sentinel **监控子应用**：**Vue 3** + **Vite 7** + **Pinia** + **ECharts** + **Tailwind CSS 4**，默认端口 **3002**。由主应用 **Wujie** 嵌入；链上数据以 **viem** 只读查询为主（余额、多链 ERC20 扫描等）。

---

## 职责与数据流

- **监控看板**：`views/MonitorDashboard` — 多链资产、图表序列（`hooks/useChartSeries`）、区块监听触发刷新。
- **链上服务**：`services/monitorChainService.ts` — 原生币余额、跨链 ERC20 扫描（`scanErc20AcrossChains` 等）；`utils/viemClients.ts` 管理客户端。
- **状态**：`stores/useMonitorStore.ts`（监控数据）、`stores/useWeb3Store.ts`（从 `window.$wujie.props` 同步宿主 Web3 状态）。
- **Wujie**：`utils/wujie-bus-listener.ts` 等与宿主事件联动；独立调试时可依赖 `VITE_BFF_ORIGIN`（若某功能需访问主域 BFF）。

与 **sub-react** 不同：开发环境 **未** 配置 Vite `server.proxy`；监控核心路径不依赖 `/api` 代理，嵌入宿主后钱包状态由 Wujie props 注入。

---

## 命令

```bash
# 开发（端口 3002）
pnpm --filter sub-vue dev

# 生产静态预览（0.0.0.0:3002，PM2 使用 preview:host）
pnpm --filter sub-vue build
pnpm --filter sub-vue run preview:host
```

测试（Vitest + happy-dom）：

```bash
pnpm --filter sub-vue test
```

---

## 目录速览

| 路径 | 说明 |
|------|------|
| `src/views/MonitorDashboard` | 监控主视图与 `useData` |
| `src/views/TokenManager` | 代币管理 |
| `src/components/monitor` | 监控相关展示组件 |
| `src/components/charts` | ECharts 封装 |
| `src/services/monitorChainService.ts` | 链上拉取与聚合 |
| `src/constants/chains.ts` | 链配置 |
| `src/types/monitor.ts` | 监控领域类型 |

---

## 相关文档

- 根目录 [README.md](../../README.md) — 微前端端口与 `NEXT_PUBLIC_WUJIE_VUE_URL`。
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — 全仓拓扑与 BFF 关系。
- [apps/main-next/README.md](../main-next/README.md) — Wujie 与 `bffOrigin` 注入。
