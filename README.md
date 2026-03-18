# 🛡️ Sentinel: AI-Powered Blockchain Security Auditor

Sentinel 是一个基于 **Turborepo** 管理的全栈 Monorepo 项目，专注于 Web3 资产安全与实时审计。它通过 5 个协同工作的 AI Agent（由 DeepSeek-V3 驱动）实现全自动化的风险扫描、逻辑校验与安全报告生成。

## 🌟 项目亮点

- **5-Agent 协同流水线**：引入验证者与终审机制，彻底消除 AI 幻觉，确保审计结论的严谨性。
- **微前端架构**：基于 **Wujie (无界)** 实现 React 审计子应用与 Next.js 主应用的无缝集成。
- **高安全鉴权**：支持 **HttpOnly Cookie** 的跨域透传，BFF 层自动处理 Token 转发，兼顾安全与便捷。
- **实时流式响应**：利用 **SSE (Server-Sent Events)** 与 Redis Pub/Sub 实时展示 AI 思考链。

---

## 📂 项目结构 (Apps and Packages)

本仓库采用 Monorepo 结构进行管理：

- `apps/web`: 基于 **Next.js 15 (App Router)** 的主应用。作为 BFF 层处理鉴权、API 转发及主 UI。
- `apps/audit-app`: 基于 **React 18** 的独立审计模块。负责黑客风格终端 UI 及实时日志渲染。
- `apps/server`: **Node.js** 后端集群。负责任务分发、Redis 队列管理及 5-Agent 逻辑执行。
- `packages/security-sdk`: 自研区块链扫描工具包，封装了 `viem` 与资产权限审计逻辑。
- `packages/typescript-config`: 共享的 TypeScript 配置。
- `packages/eslint-config`: 共享的代码规范配置。

---

## 🤖 5-Agent 协作逻辑

| 角色                | 核心职责                                       | 关键技术               |
| :------------------ | :--------------------------------------------- | :--------------------- |
| **Researcher (A1)** | 扫描链上足迹（Footprints），提取授权数据。     | `batchAuditAllowances` |
| **Auditor (A2)**    | 深度审计合约逻辑，识别潜在漏洞。               | DeepSeek-V3            |
| **Validator (A4)**  | **[核心]** 交叉对比 A1/A2 结论，纠正逻辑矛盾。 | 逻辑推理链             |
| **Reporter (A3)**   | 整合审计证据，生成专业 Markdown 报告。         | Markdown Engine        |
| **Monitor (A5)**    | **[终审]** 风险定级并执行格式合规性检查。      | 风险阈值判定           |

---

## 🚀 快速开始

### 1. 环境准备

确保本地安装了 **Redis** (用于任务队列) 且 Node 版本 >= 18。

```sh
# 克隆项目后安装依赖
pnpm install
```
