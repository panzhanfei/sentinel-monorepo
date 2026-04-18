import type { ChatRow } from "@/types/audit";

export interface IAgentTerminalProps {
  chatRows: ChatRow[];
  onSendMessage: (msg: string) => void;
  isStreaming?: boolean;
  queuedMessageCount?: number;
  hasMoreChatHistory?: boolean;
  isLoadingOlderChat?: boolean;
  onRequestOlderChat?: () => void;
}
