export type AgentName =
  | "Scanner (DeepSeek)"
  | "Auditor (Gemini)"
  | "Decision (Groq)"
  | "Watchdog"
  | "Alerter (Bot)";

export type AgentStatus = "thinking" | "done" | "active" | "error";

export interface AgentMessage {
  agent: AgentName;
  status: AgentStatus;
  content: string;
}

export interface Asset {
  name: string;
  symbol: string;
  val: number;
  price: string;
  color: string;
  address: string;
}

export interface Portfolio {
  totalUsd: number;
  assets: Asset[];
}

export type ScanStatus = "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";
