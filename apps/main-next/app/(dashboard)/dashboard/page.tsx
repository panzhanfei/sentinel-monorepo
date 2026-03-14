"use client";

import { useDashboardData } from "./hooks/useDashboardData";
import { DashboardSkeleton } from "@/app/src/components";
import {
  AISentinelPanel,
  RiskList,
  AssetList,
  PortfolioHeader,
} from "./visuals";

import { ShieldAlert, Wallet } from "lucide-react";

export default function DashboardContent() {
  const {
    walletStatus,
    address,
    isConnected,
    assets,
    priceChange,
    totalValue,
    scanLoading,
    scanProgress,
    scanStatus,
    scanResult,
    agentLogs,
    suspiciousCount,
    handleRunDeepScan,
    handleRevoke,
  } = useDashboardData();

  // 1. 加载状态：保持原样，但建议骨架屏也做深色处理
  if (walletStatus === "connecting" || walletStatus === "reconnecting") {
    return <DashboardSkeleton />;
  }

  // 2. 未连接状态：赛博风格的“待机锁定”界面
  if (walletStatus === "disconnected" || !isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/20 backdrop-blur-xl mx-4 transition-all duration-500 hover:border-blue-500/20">
        {/* 背景装饰光晕 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />

        <div className="relative p-6 bg-slate-800/40 rounded-3xl mb-8 border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500">
          <Wallet className="w-10 h-10 text-blue-400" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-4 border-slate-900 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
          Terminal Locked
        </h2>

        <p className="text-slate-400 text-sm mt-3 font-mono px-8 text-center max-w-sm uppercase tracking-widest leading-relaxed">
          Waiting for neural link... <br />
          <span className="text-blue-500/60 font-bold">
            Connect wallet to authorize.
          </span>
        </p>

        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>
    );
  }

  const riskAllowances = scanResult?.allowances || [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 3. 顶部统计面板 - PortfolioHeader */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative">
          <PortfolioHeader
            totalValue={totalValue}
            priceChange={priceChange}
            suspiciousCount={riskAllowances.length}
            scanStatus={scanStatus}
          />
        </div>
      </div>

      {/* 4. 主布局网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        {/* 左侧区域：资产与授权 */}
        <div className="lg:col-span-3 space-y-10">
          {/* 资产列表：直接透出底层 3D */}
          <div className="relative">
            <AssetList assets={assets} />
          </div>

          {/* 授权风险列表：深度玻璃感容器 */}
          <div className="relative group">
            {/* 边框发光 */}
            <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] -m-[1px] group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

            <div className="relative bg-slate-950/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                      Exposure Analysis
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                    Allowance Risk Assessment
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">
                    Protocol Status
                  </span>
                  <span className="text-xs font-mono text-emerald-500">
                    Live_Watch_Active
                  </span>
                </div>
              </div>

              {/* 风险列表内部逻辑 */}
              <div className="min-h-[200px]">
                <RiskList allowances={riskAllowances} onRevoke={handleRevoke} />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧区域：AI 审计面板 */}
        <div className="lg:col-span-2 sticky top-24">
          <div className="relative group">
            {/* 这里的 AISentinelPanel 内部建议也做类似的透明化处理 */}
            <AISentinelPanel
              scanLoading={scanLoading}
              scanProgress={scanProgress}
              scanStatus={scanStatus}
              scanResult={scanResult}
              agentLogs={agentLogs}
              riskAllowances={riskAllowances}
              suspiciousCount={suspiciousCount}
              onRevoke={handleRevoke}
              onRunScan={handleRunDeepScan}
            />
          </div>
        </div>
      </div>

      {/* 全局装饰：页面底部渐变缩进 */}
      <div className="h-20" />
    </div>
  );
}
