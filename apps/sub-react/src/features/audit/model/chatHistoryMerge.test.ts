import { describe, expect, it } from "vitest";
import type { ChatRow } from "@/types/audit";
import { mergeOlderChatIntoRows } from "./chatHistoryMerge";

const row = (id: string): ChatRow => ({
  id,
  createdAt: "t",
  entry: { agent: "A", msg: "m", type: "normal" },
  persisted: true,
});

describe("mergeOlderChatIntoRows", () => {
  it("returns prev when nothing new", () => {
    const prev = [row("w1"), row("w2"), row("a")];
    expect(mergeOlderChatIntoRows(prev, [], 2)).toBe(prev);
  });

  it("inserts fresh rows after welcome prefix", () => {
    const welcomeLen = 2;
    const prev = [row("welcome-1"), row("welcome-2"), row("mid")];
    const fresh = [row("old1"), row("old2")];
    const out = mergeOlderChatIntoRows(prev, fresh, welcomeLen);
    expect(out.map((r) => r.id)).toEqual([
      "welcome-1",
      "welcome-2",
      "old1",
      "old2",
      "mid",
    ]);
  });

  it("skips duplicate ids", () => {
    const prev = [row("w1"), row("w2"), row("dup")];
    const fresh = [row("dup"), row("new")];
    const out = mergeOlderChatIntoRows(prev, fresh, 2);
    expect(out.map((r) => r.id)).toEqual(["w1", "w2", "new", "dup"]);
  });
});
