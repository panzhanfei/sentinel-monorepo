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
import {
  emitAuditAiStreamToHost,
  emitAuthSessionInvalidToHost,
} from "@/utils/wujieHost";
import { getBffBaseUrl } from "@/utils/bffOrigin";
import {
  buildFirstStreamRow,
  buildStreamErrorRow,
  buildSystemChatRow,
  buildUserChatRow,
  CHAT_PAGE_SIZE,
  CHAT_QUEUE_MAX,
  extendLastOrNewStreamRow,
  mergeOlderChatIntoRows,
  WELCOME_LEN,
  WELCOME_ROWS,
} from "@/utils/auditChat";
import {
  ChatSessionInitError,
  useChatSessionInit,
} from "./useChatSessionInit";

const idOpts = {
  newId: () => crypto.randomUUID(),
  isoNow: () => new Date().toISOString(),
} as const;

export const useAuditController = () => {
  const wujieWeb3Date = useWujieStore((state) => state.wujieWeb3Date);
  const { address, isConnected } = wujieWeb3Date;
  const { initChatSession } = useChatSessionInit();

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

  const ensureSession = useCallback(async (): Promise<string> => {
    try {
      const newSessionId = await initChatSession(address);
      sessionId.current = newSessionId;
      return newSessionId;
    } catch (e) {
      if (e instanceof ChatSessionInitError && e.status === 401) {
        emitAuthSessionInvalidToHost({ reason: "chat_session_init" });
      }
      throw e;
    }
  }, [address, initChatSession]);

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
      if (!sessionId.current) return;

      markStreamingStarted();

      const url = new URL("/api/chat/stream", getBffBaseUrl());
      url.searchParams.set("sessionId", sessionId.current);
      url.searchParams.set("message", message);

      const es = new EventSource(url.toString(), { withCredentials: true });
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
          const data = JSON.parse(event.data) as {
            status?: string;
            agent?: string;
            content?: string;
          };

          if (data.status === "heartbeat") return;

          if (data.status === "end") {
            drainOrRelease();
            return;
          }

          if (data.status === "error") {
            const row = buildStreamErrorRow(
              data.agent || "SYSTEM",
              data.content || "Unknown error",
              idOpts,
            );
            setChatRows((prev) => [...prev, row]);
            if (data.content?.includes("Unauthorized")) {
              emitAuthSessionInvalidToHost({ reason: "chat_stream" });
              messageQueueRef.current = [];
              setQueuedMessageCount(0);
              sessionId.current = undefined;
            }
            drainOrRelease();
            return;
          }

          if (isFirstChunk) {
            const { row, currentAgent: agent } = buildFirstStreamRow(data, idOpts);
            currentAgent = agent;
            setChatRows((prev) => [...prev, row]);
            isFirstChunk = false;
          } else {
            setChatRows((prev) => {
              const { rows, currentAgent: nextAgent } = extendLastOrNewStreamRow(
                prev,
                currentAgent,
                data,
                idOpts,
              );
              currentAgent = nextAgent;
              return rows;
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
          buildStreamErrorRow(
            "SYSTEM",
            "Connection lost. Please try again.",
            idOpts,
          ),
        ]);
        messageQueueRef.current = [];
        setQueuedMessageCount(0);
        sessionId.current = undefined;
        drainOrRelease();
      };
    },
    [markStreamingStarted, markStreamingEnded],
  );

  useLayoutEffect(() => {
    startChatStreamRef.current = startChatStream;
  }, [startChatStream]);

  const sendMessageToAgent = useCallback(
    async (message: string) => {
      if (!address || !isConnected) {
        setChatRows((prev) => [
          ...prev,
          buildSystemChatRow(
            "请先连接钱包。若已连接仍无法对话，请在主站重新登录。",
            idOpts,
          ),
        ]);
        return;
      }

      if (!sessionId.current) {
        try {
          await ensureSession();
        } catch (err) {
          console.error("Session init failed:", err);
          setChatRows((prev) => [
            ...prev,
            buildSystemChatRow(
              `Failed to initialize session: ${err instanceof Error ? err.message : "Unknown error"}`,
              idOpts,
            ),
          ]);
          return;
        }
      }

      if (!sessionId.current) {
        setChatRows((prev) => [
          ...prev,
          buildSystemChatRow(
            "Session ID is still undefined after initialization.",
            idOpts,
          ),
        ]);
        return;
      }

      if (
        streamingActiveRef.current &&
        messageQueueRef.current.length >= CHAT_QUEUE_MAX
      ) {
        setChatRows((prev) => [
          ...prev,
          buildSystemChatRow(
            `队列已满（最多 ${CHAT_QUEUE_MAX} 条），请稍后再发。`,
            idOpts,
          ),
        ]);
        return;
      }

      const userRow = buildUserChatRow(message, idOpts);

      setChatRows((prev) => [...prev, userRow]);

      if (streamingActiveRef.current) {
        messageQueueRef.current.push(message);
        setQueuedMessageCount(messageQueueRef.current.length);
        return;
      }

      startChatStream(message);
    },
    [address, isConnected, ensureSession, startChatStream],
  );

  const requestOlderChat = useCallback(async () => {
    if (
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
        sessionId.current,
        {
          limit: CHAT_PAGE_SIZE,
          beforeCreatedAt: firstPersisted.createdAt,
        },
      );

      const fresh = messages.map(mapHistoryMessageToChatRow);
      setChatRows((prev) => mergeOlderChatIntoRows(prev, fresh, WELCOME_LEN));
      setHasMoreChatHistory(hasMore);
    } catch (e) {
      console.error("load older chat failed:", e);
    } finally {
      setIsLoadingOlderChat(false);
    }
  }, [hasMoreChatHistory, isLoadingOlderChat]);

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

    if (!address || !isConnected) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        await ensureSession();
        if (cancelled || !sessionId.current) return;
        const { messages, hasMore } = await fetchChatMessages(
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
  }, [address, isConnected, ensureSession, closeEventSource]);

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
    onSendMessage: sendMessageToAgent,
  };
}
