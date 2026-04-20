// alert.ts
export type AlertType = "transfer" | "approval";

export interface BaseAlertPayload {
  type: AlertType;
  txHash: `0x${string}`;
  blockNumber: string; // 改为 string，匹配 JSON 序列化后的格式
  value: string;
}

export interface TransferAlert extends BaseAlertPayload {
  type: "transfer";
  from: `0x${string}`;
  to: `0x${string}`;
}

export interface ApprovalAlert extends BaseAlertPayload {
  type: "approval";
  owner: `0x${string}`;
  spender: `0x${string}`;
}

// 系统内部消息（心跳、连接成功）
export interface SseConnected {
  type: "connected";
  status: string;
  timestamp: number;
}

export interface SsePing {
  type: "ping";
  tick: number;
}

// 所有可能通过 SSE 发送的消息类型
export type SseMessage = TransferAlert | ApprovalAlert | SseConnected | SsePing;
