import type { ChatRow } from "@/types";

export interface IdNowOptions {
  newId: () => string;
  isoNow: () => string;
}

export const buildStreamErrorRow = (agent: string, message: string, opts: IdNowOptions) : ChatRow => {
  return {
    id: `local-err-${opts.newId()}`,
    createdAt: opts.isoNow(),
    entry: { agent, msg: message, type: "error" },
    persisted: false,
  };
}

export const buildFirstStreamRow = (data: { agent?: string; content?: string; status?: string }, opts: IdNowOptions) : { row: ChatRow; currentAgent: string } => {
  const currentAgent = data.agent || "AGENT";
  return {
    currentAgent,
    row: {
      id: `local-${opts.newId()}`,
      createdAt: opts.isoNow(),
      entry: {
        agent: currentAgent,
        msg: data.content || "",
        type: data.status === "done" ? "success" : "normal",
      },
      persisted: false,
    },
  };
}

export const extendLastOrNewStreamRow = (prev: ChatRow[], currentAgent: string, data: { agent?: string; content?: string; status?: string }, opts: IdNowOptions) : { rows: ChatRow[]; currentAgent: string } => {
  const last = prev[prev.length - 1];
  if (last && last.entry.agent === currentAgent) {
    const newLast: ChatRow = {
      ...last,
      entry: {
        ...last.entry,
        msg: last.entry.msg + (data.content || ""),
        type: data.status === "done" ? "success" : last.entry.type,
      },
    };
    return { rows: [...prev.slice(0, -1), newLast], currentAgent };
  }

  const agent = data.agent || "AGENT";
  const row: ChatRow = {
    id: `local-${opts.newId()}`,
    createdAt: opts.isoNow(),
    entry: {
      agent,
      msg: data.content || "",
      type: data.status === "done" ? "success" : "normal",
    },
    persisted: false,
  };
  return { rows: [...prev, row], currentAgent: agent };
}

export const buildUserChatRow = (message: string, opts: IdNowOptions) : ChatRow => {
  return {
    id: `local-${opts.newId()}`,
    createdAt: opts.isoNow(),
    entry: { agent: "YOU", msg: message, type: "user" },
    persisted: false,
  };
}

export const buildSystemChatRow = (message: string, opts: IdNowOptions) : ChatRow => {
  return {
    id: `local-${opts.newId()}`,
    createdAt: opts.isoNow(),
    entry: { agent: "SYSTEM", msg: message, type: "error" },
    persisted: false,
  };
}
