import { describe, expect, it } from "vitest";
import type { ChatRow } from "@/types";
import {
  buildFirstStreamRow,
  buildStreamErrorRow,
  buildSystemChatRow,
  buildUserChatRow,
  extendLastOrNewStreamRow,
} from "./chatRowBuilders";

const opts = {
  newId: () => "id-1",
  isoNow: () => "2020-01-01T00:00:00.000Z",
};

describe("buildFirstStreamRow", () => {
  it("uses agent from payload and normal type when not done", () => {
    const { row, currentAgent } = buildFirstStreamRow(
      { agent: "Scanner", content: "hello", status: "thinking" },
      opts,
    );
    expect(currentAgent).toBe("Scanner");
    expect(row.entry).toMatchObject({
      agent: "Scanner",
      msg: "hello",
      type: "normal",
    });
  });

  it("defaults agent and success on done", () => {
    const { row, currentAgent } = buildFirstStreamRow(
      { content: "x", status: "done" },
      opts,
    );
    expect(currentAgent).toBe("AGENT");
    expect(row.entry.type).toBe("success");
  });
});

describe("extendLastOrNewStreamRow", () => {
  const base: ChatRow[] = [
    {
      id: "a",
      createdAt: "t",
      entry: { agent: "AGENT", msg: "hi", type: "normal" },
      persisted: false,
    },
  ];

  it("extends last row when agent matches", () => {
    const { rows, currentAgent } = extendLastOrNewStreamRow(
      base,
      "AGENT",
      { content: " there", status: "thinking" },
      { newId: () => "n", isoNow: () => "t2" },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].entry.msg).toBe("hi there");
    expect(currentAgent).toBe("AGENT");
  });

  it("pushes new row when agent differs", () => {
    const { rows, currentAgent } = extendLastOrNewStreamRow(
      base,
      "OTHER",
      { agent: "X", content: "new", status: "thinking" },
      { newId: () => "n2", isoNow: () => "t3" },
    );
    expect(rows).toHaveLength(2);
    expect(rows[1].entry.agent).toBe("X");
    expect(currentAgent).toBe("X");
  });
});

describe("buildStreamErrorRow", () => {
  it("prefixes id with local-err", () => {
    const row = buildStreamErrorRow("SYS", "oops", opts);
    expect(row.id.startsWith("local-err-")).toBe(true);
    expect(row.entry.type).toBe("error");
  });
});

describe("buildUserChatRow / buildSystemChatRow", () => {
  it("builds user row", () => {
    const row = buildUserChatRow("ping", opts);
    expect(row.entry).toMatchObject({ agent: "YOU", type: "user", msg: "ping" });
  });

  it("builds system error row", () => {
    const row = buildSystemChatRow("fail", opts);
    expect(row.entry).toMatchObject({ agent: "SYSTEM", type: "error" });
  });
});
