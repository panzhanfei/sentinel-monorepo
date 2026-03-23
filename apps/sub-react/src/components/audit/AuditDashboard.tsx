import type { AuditDashboardViewProps } from "@/types/audit";
import { AgentTerminal } from "./AgentTerminal";
import { FootprintTable } from "./FootprintTable";
import { OverviewCards } from "./OverviewCards";

export function AuditDashboard({
  address,
  txCount,
  riskRelatedCount,
  txList,
  isLoading,
  isAgentStreaming,
  logs,
  onSendMessage,
}: AuditDashboardViewProps) {
  const hasWallet = Boolean(address);

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 p-6 font-mono selection:bg-indigo-500/30">
      <div className="max-w-400 mx-auto space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-10">
            <OverviewCards
              txCount={txCount}
              riskCount={riskRelatedCount}
            />
            <FootprintTable
              txList={txList}
              isLoading={isLoading}
              hasWallet={hasWallet}
            />
          </div>

          <div className="lg:col-span-2">
            <AgentTerminal
              logs={logs}
              onSendMessage={onSendMessage}
              inputLocked={Boolean(isAgentStreaming)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
