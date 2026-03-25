import { AuditDashboard } from "@/components/audit";
import { useAuditData } from "@/useAuditData";

const App = () => {
  const {
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
    sendMessageToAgent,
  } = useAuditData();

  return (
    <AuditDashboard
      address={address}
      txCount={txCount}
      riskRelatedCount={riskRelatedCount}
      txList={txList}
      isLoading={isLoading}
      isAgentStreaming={isAgentStreaming}
      queuedMessageCount={queuedMessageCount}
      chatRows={chatRows}
      hasMoreChatHistory={hasMoreChatHistory}
      isLoadingOlderChat={isLoadingOlderChat}
      onRequestOlderChat={onRequestOlderChat}
      onSendMessage={sendMessageToAgent}
    />
  );
};

export default App;
