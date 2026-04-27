import type { ChatRow } from "@/types";

export const WELCOME_ROWS: ChatRow[] = [
  {
    id: "welcome-system",
    createdAt: "1970-01-01T00:00:00.000Z",
    entry: {
      agent: "SYSTEM",
      msg: "Initializing Multi-Agent Security Protocol...",
      type: "sys",
    },
    persisted: false,
  },
  {
    id: "welcome-supervisor",
    createdAt: "1970-01-01T00:00:00.001Z",
    entry: {
      agent: "SUPERVISOR_A",
      msg: "Heartbeat detected. All agents standing by.",
      type: "success",
    },
    persisted: false,
  },
];

export const WELCOME_LEN = WELCOME_ROWS.length;

export const CHAT_PAGE_SIZE = 5;

export const CHAT_QUEUE_MAX = 30;
