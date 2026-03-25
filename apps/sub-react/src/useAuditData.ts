import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useWujieStore } from "@/stores";
import { publicClient } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchFootprintAudit } from "@/api/audit";
import {
  fetchChatMessages,
  mapHistoryMessageToChatRow,
} from "@/api/chatHistory";
import type { ChatRow } from "@/types/audit";
import { emitAuditAiStreamToHost } from "@/utils/wujieHost";

const WELCOME_ROWS: ChatRow[] = [
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

const WELCOME_LEN = WELCOME_ROWS.length;
const CHAT_PAGE_SIZE = 5;
const CHAT_QUEUE_MAX = 30;

export function useAuditData() {
  const wujieWeb3Date = useWujieStore((state) => state.wujieWeb3Date);
  const wujieAfterMount = useWujieStore((state) => state.wujieAfterMount);
  const { address, token } = wujieWeb3Date;

  const sessionId = useRef<string | undefined>(undefined);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const streamingActiveRef = useRef(false);
  const startChatStreamRef = useRef<(message: string) => void>(() => {});
  const loadOlderDebounceRef = useRef(0);

  const [isAgentStreaming, setIsAgentStreaming] = useState(false);
  const [queuedMessageCount, setQueuedMessageCount] = useState(0);
  const [chatRows, setChatRows] = useState<ChatRow[]>(() => [...WELCOME_ROWS]);
  const chatRowsRef = useRef<ChatRow[]>(chatRows);

  useLayoutEffect(() => {
    chatRowsRef.current = chatRows;
  }, [chatRows]);
  const [hasMoreChatHistory, setHasMoreChatHistory] = useState(false);
  const [isLoadingOlderChat, setIsLoadingOlderChat] = useState(false);

  const { data: txCount = 0 } = useQuery<number>({
    queryKey: ["txCount", address],
    enabled: Boolean(address),
    queryFn: async () => {
      const account = address as `0x${string}`;
      const latestCount = await publicClient.getTransactionCount({
        address: account,
        blockTag: "latest",
      });
      return latestCount;
    },
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });

  const { data: footprintAudit, isLoading } = useQuery({
    queryKey: ["footprintAudit", address],
    queryFn: () =>
      fetchFootprintAudit(publicClient, address!, {
        limit: 10,
        maxBlocks: 300,
      }),
    enabled: !!address,
  });
  const txList = footprintAudit?.transactions;
  const riskRelatedCount = footprintAudit?.riskRelatedCount ?? 0;

  const initSession = useCallback(async (): Promise<string> => {
    if (!token) throw new Error("No token available");

    const res = await fetch(
      `/api/chat/session?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address, token }),
      },
    );

    if (!res.ok) {
      throw new Error(
        `Failed to init session: ${res.status} ${res.statusText}`,
      );
    }

    const { sessionId: newSessionId } = await res.json();
    if (!newSessionId) throw new Error("Session ID missing in response");

    sessionId.current = newSessionId;
    return newSessionId;
  }, [token, address]);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const markStreamingEnded = useCallback(() => {
    streamingActiveRef.current = false;
    setIsAgentStreaming(false);
    emitAuditAiStreamToHost(false);
  }, []);

  const markStreamingStarted = useCallback(() => {
    if (streamingActiveRef.current) return;
    streamingActiveRef.current = true;
    setIsAgentStreaming(true);
    emitAuditAiStreamToHost(true);
  }, []);

  const startChatStream = useCallback(
    (message: string) => {
      if (!sessionId.current || !token) return;

      markStreamingStarted();

      const url = new URL("/api/chat/stream", window.location.origin);
      url.searchParams.set("sessionId", sessionId.current);
      url.searchParams.set("message", message);
      url.searchParams.set("token", token);

      const es = new EventSource(url.toString());
      eventSourceRef.current = es;

      let currentAgent = "";
      let isFirstChunk = true;

      const finishConnection = () => {
        es.close();
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
      };

      const drainOrRelease = () => {
        finishConnection();
        const next = messageQueueRef.current.shift();
        setQueuedMessageCount(messageQueueRef.current.length);
        if (next) {
          queueMicrotask(() => startChatStreamRef.current(next));
        } else {
          markStreamingEnded();
        }
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status === "heartbeat") return;

          if (data.status === "end") {
            drainOrRelease();
            return;
          }

          if (data.status === "error") {
            setChatRows((prev) => [
              ...prev,
              {
                id: `local-err-${crypto.randomUUID()}`,
                createdAt: new Date().toISOString(),
                entry: {
                  agent: data.agent || "SYSTEM",
                  msg: data.content || "Unknown error",
                  type: "error",
                },
                persisted: false,
              },
            ]);
            if (data.content?.includes("Unauthorized")) {
              messageQueueRef.current = [];
              setQueuedMessageCount(0);
              sessionId.current = undefined;
            }
            drainOrRelease();
            return;
          }

          if (isFirstChunk) {
            currentAgent = data.agent || "AGENT";
            setChatRows((prev) => [
              ...prev,
              {
                id: `local-${crypto.randomUUID()}`,
                createdAt: new Date().toISOString(),
                entry: {
                  agent: currentAgent,
                  msg: data.content || "",
                  type: data.status === "done" ? "success" : "normal",
                },
                persisted: false,
              },
            ]);
            isFirstChunk = false;
          } else {
            setChatRows((prev) => {
              const nextRows = [...prev];
              const last = nextRows[nextRows.length - 1];
              if (last && last.entry.agent === currentAgent) {
                last.entry = {
                  ...last.entry,
                  msg: last.entry.msg + (data.content || ""),
                  type:
                    data.status === "done" ? "success" : last.entry.type,
                };
              } else {
                nextRows.push({
                  id: `local-${crypto.randomUUID()}`,
                  createdAt: new Date().toISOString(),
                  entry: {
                    agent: data.agent || "AGENT",
                    msg: data.content || "",
                    type: data.status === "done" ? "success" : "normal",
                  },
                  persisted: false,
                });
                currentAgent = data.agent || "AGENT";
              }
              return nextRows;
            });
          }
        } catch (e) {
          console.error("Failed to parse event data:", e);
        }
      };

      es.onerror = (err) => {
        console.error("EventSource error:", err);
        setChatRows((prev) => [
          ...prev,
          {
            id: `local-err-${crypto.randomUUID()}`,
            createdAt: new Date().toISOString(),
            entry: {
              agent: "SYSTEM",
              msg: "Connection lost. Please try again.",
              type: "error",
            },
            persisted: false,
          },
        ]);
        messageQueueRef.current = [];
        setQueuedMessageCount(0);
        sessionId.current = undefined;
        drainOrRelease();
      };
    },
    [token, markStreamingStarted, markStreamingEnded],
  );

  useLayoutEffect(() => {
    startChatStreamRef.current = startChatStream;
  }, [startChatStream]);

  const sendMessageToAgent = useCallback(
    async (message: string) => {
      if (!token) {
        setChatRows((prev) => [
          ...prev,
          {
            id: `local-${crypto.randomUUID()}`,
            createdAt: new Date().toISOString(),
            entry: {
              agent: "SYSTEM",
              msg: "Authentication token missing. Please reconnect wallet.",
              type: "error",
            },
            persisted: false,
          },
        ]);
        return;
      }

      if (!sessionId.current) {
        try {
          await initSession();
        } catch (err) {
          console.error("Session init failed:", err);
          setChatRows((prev) => [
            ...prev,
            {
              id: `local-${crypto.randomUUID()}`,
              createdAt: new Date().toISOString(),
              entry: {
                agent: "SYSTEM",
                msg: `Failed to initialize session: ${err instanceof Error ? err.message : "Unknown error"}`,
                type: "error",
              },
              persisted: false,
            },
          ]);
          return;
        }
      }

      if (!sessionId.current) {
        setChatRows((prev) => [
          ...prev,
          {
            id: `local-${crypto.randomUUID()}`,
            createdAt: new Date().toISOString(),
            entry: {
              agent: "SYSTEM",
              msg: "Session ID is still undefined after initialization.",
              type: "error",
            },
            persisted: false,
          },
        ]);
        return;
      }

      if (
        streamingActiveRef.current &&
        messageQueueRef.current.length >= CHAT_QUEUE_MAX
      ) {
        setChatRows((prev) => [
          ...prev,
          {
            id: `local-${crypto.randomUUID()}`,
            createdAt: new Date().toISOString(),
            entry: {
              agent: "SYSTEM",
              msg: `队列已满（最多 ${CHAT_QUEUE_MAX} 条），请稍后再发。`,
              type: "error",
            },
            persisted: false,
          },
        ]);
        return;
      }

      const userRow: ChatRow = {
        id: `local-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
        entry: { agent: "YOU", msg: message, type: "user" },
        persisted: false,
      };

      setChatRows((prev) => [...prev, userRow]);

      if (streamingActiveRef.current) {
        messageQueueRef.current.push(message);
        setQueuedMessageCount(messageQueueRef.current.length);
        return;
      }

      startChatStream(message);
    },
    [token, initSession, startChatStream],
  );

  const requestOlderChat = useCallback(async () => {
    if (
      !token ||
      !sessionId.current ||
      !hasMoreChatHistory ||
      isLoadingOlderChat ||
      streamingActiveRef.current
    ) {
      return;
    }
    const now = Date.now();
    if (now - loadOlderDebounceRef.current < 500) return;
    loadOlderDebounceRef.current = now;

    const firstPersisted = chatRowsRef.current
      .slice(WELCOME_LEN)
      .find((r) => r.persisted);
    if (!firstPersisted) return;

    setIsLoadingOlderChat(true);
    try {
      const { messages, hasMore } = await fetchChatMessages(
        token,
        sessionId.current,
        {
          limit: CHAT_PAGE_SIZE,
          beforeCreatedAt: firstPersisted.createdAt,
        },
      );

      const fresh = messages.map(mapHistoryMessageToChatRow);
      setChatRows((prev) => {
        const existing = new Set(prev.map((r) => r.id));
        const merged = fresh.filter((r) => !existing.has(r.id));
        if (merged.length === 0) {
          return prev;
        }
        const welcome = prev.slice(0, WELCOME_LEN);
        const rest = prev.slice(WELCOME_LEN);
        return [...welcome, ...merged, ...rest];
      });
      setHasMoreChatHistory(hasMore);
    } catch (e) {
      console.error("load older chat failed:", e);
    } finally {
      setIsLoadingOlderChat(false);
    }
  }, [token, hasMoreChatHistory, isLoadingOlderChat]);

  useEffect(() => {
    let cancelled = false;
    sessionId.current = undefined;
    messageQueueRef.current = [];
    streamingActiveRef.current = false;
    setQueuedMessageCount(0);
    setIsAgentStreaming(false);
    emitAuditAiStreamToHost(false);
    closeEventSource();
    setChatRows([...WELCOME_ROWS]);
    setHasMoreChatHistory(false);
    setIsLoadingOlderChat(false);

    if (!token || !address) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        await initSession();
        if (cancelled || !sessionId.current) return;
        const { messages, hasMore } = await fetchChatMessages(
          token,
          sessionId.current,
          { limit: CHAT_PAGE_SIZE },
        );
        if (cancelled) return;
        const mapped = messages.map(mapHistoryMessageToChatRow);
        setChatRows([...WELCOME_ROWS, ...mapped]);
        setHasMoreChatHistory(hasMore);
      } catch (e) {
        console.error("chat history bootstrap failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, address, initSession, closeEventSource]);

  useEffect(() => {
    return () => {
      closeEventSource();
      messageQueueRef.current = [];
      streamingActiveRef.current = false;
      setQueuedMessageCount(0);
      setIsAgentStreaming(false);
      emitAuditAiStreamToHost(false);
    };
  }, [closeEventSource]);

  useEffect(() => {
    wujieAfterMount?.();
  }, [wujieAfterMount]);

  return {
    address,
    txCount,
    riskRelatedCount,
    txList,
    isLoading,
    isAgentStreaming,
    queuedMessageCount,
    chatRows,
    hasMoreChatHistory,
    isLoadingOlderChat,
    onRequestOlderChat: requestOlderChat,
    sendMessageToAgent,
  };
}
