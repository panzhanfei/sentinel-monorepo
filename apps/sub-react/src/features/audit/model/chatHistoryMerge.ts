import type { ChatRow } from "@/types/audit";

/** 将更早的已持久化消息合并到当前列表（欢迎语之后、其余之前） */
export function mergeOlderChatIntoRows(
  prev: ChatRow[],
  fresh: ChatRow[],
  welcomeLen: number,
): ChatRow[] {
  const existing = new Set(prev.map((r) => r.id));
  const merged = fresh.filter((r) => !existing.has(r.id));
  if (merged.length === 0) {
    return prev;
  }
  const welcome = prev.slice(0, welcomeLen);
  const rest = prev.slice(welcomeLen);
  return [...welcome, ...merged, ...rest];
}
