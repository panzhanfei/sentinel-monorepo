import type { PublicClient } from "viem";
import { getAddress } from "viem";
import type { Transaction } from "@/types/audit";

/** 当前地址作为发送方、且 calldata 为常见授权 / 许可类调用（单笔交易计 1） */
const RISK_APPROVAL_SELECTORS = new Set([
  "0x095ea7b3", // approve(address,uint256)
  "0x39509351", // increaseAllowance(address,uint256)
  "0xa22cb465", // setApprovalForAll(address,bool)
  "0xd505accf", // permit(...) EIP-2612
]);

function selectorOfInput(input: `0x${string}` | undefined): string | null {
  if (!input || input.length < 10) return null;
  return input.slice(0, 10).toLowerCase();
}

function isRiskApprovalCalldata(input: `0x${string}` | undefined): boolean {
  const sel = selectorOfInput(input);
  return sel != null && RISK_APPROVAL_SELECTORS.has(sel);
}

export interface FootprintAuditResult {
  transactions: Transaction[];
  /** 最近 maxBlocks 内，由该地址发起的授权类交易笔数 */
  riskRelatedCount: number;
}

/**
 * 单次扫描：Footprint 列表（限量）+ 窗口内风险相关笔数（全量计数）。
 */
export async function fetchFootprintAudit(
  client: PublicClient,
  address: string,
  opts?: { maxBlocks?: number; limit?: number },
): Promise<FootprintAuditResult> {
  const maxBlocks = opts?.maxBlocks ?? 300;
  const limit = opts?.limit ?? 10;
  const addr = getAddress(address);
  const addrLower = addr.toLowerCase();

  const latest = await client.getBlockNumber();
  const transactions: Transaction[] = [];
  let riskRelatedCount = 0;

  for (let i = 0n; i < BigInt(maxBlocks); i++) {
    const n = latest - i;
    if (n < 0n) break;

    const block = await client.getBlock({
      blockNumber: n,
      includeTransactions: true,
    });
    if (!block.transactions?.length) continue;

    for (const tx of block.transactions) {
      if (typeof tx === "string") continue;

      const fromLower = tx.from?.toLowerCase();
      if (fromLower === addrLower && isRiskApprovalCalldata(tx.input)) {
        riskRelatedCount += 1;
      }

      const fromMatch = fromLower === addrLower;
      const toMatch =
        tx.to != null && tx.to.toLowerCase() === addrLower;
      if (!fromMatch && !toMatch) continue;

      if (transactions.length < limit) {
        transactions.push({ hash: tx.hash, value: tx.value.toString() });
      }
    }
  }

  return { transactions, riskRelatedCount };
}
