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
    logs,
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
      logs={logs}
      onSendMessage={sendMessageToAgent}
    />
  );
};

export default App;
