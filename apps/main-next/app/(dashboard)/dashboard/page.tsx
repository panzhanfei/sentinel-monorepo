"use client";

import { useDashboardData, Address } from "./hooks/useDashboardData";
import { DashboardSkeleton } from "@/app/src/components";
import { PortfolioHeader } from "./ui-components/PortfolioHeader";
import { AssetList } from "./ui-components/AssetList";
import { AISentinelPanel } from "./ui-components/AISentinelPanel";
import { RiskList } from "./ui-components/RiskList";

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

  if (walletStatus === "connecting" || walletStatus === "reconnecting") {
    return <DashboardSkeleton />;
  }

  if (walletStatus === "disconnected" || !isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] bg-white/50 backdrop-blur-xl rounded-[2rem] border border-dashed border-slate-300 mx-4">
        <div className="p-4 bg-indigo-50 rounded-2xl mb-6 animate-bounce">
          <span className="text-3xl">🛡️</span>
        </div>

        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          Sentinel Guard Locked
        </h2>

        <p className="text-slate-500 text-sm mt-2 font-medium px-8 text-center max-w-sm">
          Connect wallet to synchronize real-time blockchain data.
        </p>
      </div>
    );
  }

  // const riskAllowances =
  //   scanResult?.allowances?.filter((a) => BigInt(a.rawAllowance) > BigInt(0)) ||
  //   [];
  const riskAllowances = scanResult?.allowances || [];
  console.log("riskAllowances:", scanResult);
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      {/* 顶部统计 */}
      <PortfolioHeader
        totalValue={totalValue}
        priceChange={priceChange}
        suspiciousCount={riskAllowances.length}
        scanStatus={scanStatus}
      />

      {/* 主布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* 左侧 */}
        <div className="lg:col-span-3 space-y-8">
          {/* 资产 */}
          <AssetList assets={assets} />

          {/* 风险列表 */}
          <div className="bg-white/70 backdrop-blur-md p-8 rounded-4xl border border-white shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">
                Allowance Risk
              </h3>

              <span className="text-xs font-bold text-slate-400">
                ERC20 APPROVALS
              </span>
            </div>

            <RiskList allowances={riskAllowances} onRevoke={handleRevoke} />
          </div>
        </div>

        {/* 右侧 AI */}
        <div className="lg:col-span-2">
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
  );
}
