import type { Address } from "viem";

export type ScanStatus =
  | "IDLE"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export interface AllowanceAudit {
  tokenSymbol: string;
  tokenAddress: string;
  spenderName: string;
  spenderAddress: string;
  allowance: string;
  rawAllowance: string;
}

export interface ScanResultData {
  risk: "LOW" | "MEDIUM" | "HIGH";
  allowances: AllowanceAudit[];
  details: {
    riskCount: number;
    message: string;
    timestamp: number;
    isNewWallet?: boolean;
  };
}

export interface AgentMessage {
  agent: string;
  status: "thinking" | "done" | "active" | "error";
  content: string;
}
