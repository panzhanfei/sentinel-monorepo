import type { ChatRow, Transaction } from "@/types/audit";

/** 纯展示层 props，与数据获取解耦 */
export type { Transaction };

export interface AuditDashboardViewProps {
  address?: string;
  txCount?: number;
  /** 最近扫描窗口内，当前地址发起的授权 / 许可类交易笔数 */
  riskRelatedCount?: number;
  txList?: Transaction[];
  isLoading: boolean;
  /** AI 流式输出中，用于禁用输入并与主应用背景联动 */
  isAgentStreaming?: boolean;
  /** 当前在排队等待发送的用户消息条数 */
  queuedMessageCount?: number;
  chatRows: ChatRow[];
  /** 是否还有更早消息可拉取 */
  hasMoreChatHistory?: boolean;
  /** 正在拉取更早消息 */
  isLoadingOlderChat?: boolean;
  /** 滚顶或下拉触发（由终端内部调用） */
  onRequestOlderChat?: () => void;
  onSendMessage: (msg: string) => void;
}
