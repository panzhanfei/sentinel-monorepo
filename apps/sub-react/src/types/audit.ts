export interface LogEntry {
  agent: string;
  msg: string;
  type: string;
}

export interface Transaction {
  hash: string;
  value: string;
}

/** 纯展示层 props，与数据获取解耦 */
export interface AuditDashboardViewProps {
  address?: string;
  txCount?: number;
  txList?: Transaction[];
  isLoading: boolean;
  /** AI 流式输出中，用于禁用输入并与主应用背景联动 */
  isAgentStreaming?: boolean;
  logs: LogEntry[];
  onSendMessage: (msg: string) => void;
}
