import type { IAuditDashboardViewProps } from "./interface";
import { AgentTerminal, FootprintTable, OverviewCards } from "@/components";

export const AuditDashboard = ({
  address,
  txCount,
  riskRelatedCount,
  txList,
  isLoading,
  isAgentStreaming,
  queuedMessageCount,
  chatRows,
  hasMoreChatHistory,
  isLoadingOlderChat,
  onRequestOlderChat,
  onSendMessage,
}: IAuditDashboardViewProps) => {
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
              chatRows={chatRows}
              onSendMessage={onSendMessage}
              isStreaming={Boolean(isAgentStreaming)}
              queuedMessageCount={queuedMessageCount ?? 0}
              hasMoreChatHistory={hasMoreChatHistory}
              isLoadingOlderChat={isLoadingOlderChat}
              onRequestOlderChat={onRequestOlderChat}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
