export interface LogEntry {
  agent: string;
  msg: string;
  /** user = 用户发送；其余为系统/Agent 输出 */
  type: "sys" | "success" | "normal" | "error" | "user";
}

/** 终端虚拟列表一行（含服务端同步标记） */
export interface ChatRow {
  id: string;
  createdAt: string;
  entry: LogEntry;
  /** 是否已落库，用于滚顶加载游标 */
  persisted: boolean;
}

export interface Transaction {
  hash: string;
  value: string;
}
