import type { ChatRow, LogEntry } from "@/types/audit";
import { getBffBaseUrl } from "@/utils/bffOrigin";
import { emitAuthSessionInvalidToHost } from "@/utils/wujieHost";

export type ChatHistoryMessage = {
  id: string;
  role: string;
  agent: string;
  content: string;
  status: string;
  createdAt: string;
};

export const fetchChatMessages = async (sessionId: string, options: {
    limit: number;
    /** 当前已展示数据中最早一条的 createdAt（ISO），拉取严格更早的一页 */
    beforeCreatedAt?: string;
  }) : Promise<{ messages: ChatHistoryMessage[]; hasMore: boolean }> => {
  const url = new URL("/api/chat/messages", getBffBaseUrl());
  url.searchParams.set("sessionId", sessionId);
  url.searchParams.set("limit", String(options.limit));
  if (options.beforeCreatedAt) {
    url.searchParams.set("before", options.beforeCreatedAt);
  }

  const res = await fetch(url.toString(), { credentials: "include" });

  if (!res.ok) {
    if (res.status === 401) {
      emitAuthSessionInvalidToHost({ reason: "chat_messages" });
    }
    throw new Error(`chat messages ${res.status}`);
  }

  const body = (await res.json()) as {
    success?: boolean;
    data?: { messages?: ChatHistoryMessage[]; hasMore?: boolean };
  };

  if (!body.success || !body.data) {
    throw new Error(`chat messages invalid response ${res.status}`);
  }

  return {
    messages: body.data.messages ?? [],
    hasMore: Boolean(body.data.hasMore),
  };
}

export const mapHistoryMessageToChatRow = (m: ChatHistoryMessage) : ChatRow => {
  let entry: LogEntry;
  if (m.role === "user") {
    entry = { agent: "YOU", msg: m.content, type: "user" };
  } else if (m.role === "assistant") {
    const t =
      m.status === "error"
        ? "error"
        : m.status === "done"
          ? "success"
          : "normal";
    entry = { agent: m.agent, msg: m.content, type: t };
  } else {
    entry = {
      agent: m.agent || "SYSTEM",
      msg: m.content,
      type: "sys",
    };
  }

  return {
    id: m.id,
    createdAt: m.createdAt,
    entry,
    persisted: true,
  };
}
