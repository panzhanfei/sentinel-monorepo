import { useEffect, useState, useRef, useCallback } from "react";
import { useWujieStore } from "@/stores";
import { publicClient } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchFootprintAudit } from "@/api/audit";
import type { LogEntry } from "@/types/audit";
import { emitAuditAiStreamToHost } from "@/utils/wujieHost";

export function useAuditData() {
  const wujieWeb3Date = useWujieStore((state) => state.wujieWeb3Date);
  const wujieAfterMount = useWujieStore((state) => state.wujieAfterMount);
  const { address, token } = wujieWeb3Date;

  const sessionId = useRef<string | undefined>(undefined);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [isAgentStreaming, setIsAgentStreaming] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      agent: "SYSTEM",
      msg: "Initializing Multi-Agent Security Protocol...",
      type: "sys",
    },
    {
      agent: "SUPERVISOR_A",
      msg: "Heartbeat detected. All agents standing by.",
      type: "success",
    },
  ]);

  // 获取交易数量
  const { data: txCount = 0 } = useQuery<number>({
    queryKey: ["txCount", address],
    enabled: Boolean(address),
    queryFn: async () => {
      const account = address as `0x${string}`;
      // 因此这里以 latest 交易计数为准即可。
      const latestCount = await publicClient.getTransactionCount({
        address: account,
        blockTag: "latest",
      });

      return latestCount;
    },
    refetchInterval: 3_000,
    refetchOnWindowFocus: true,
  });

  // Footprint 列表 + 风险相关笔数：同一次区块扫描
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

  // 初始化会话
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

  // 关闭当前 EventSource
  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const endAgentStream = useCallback(() => {
    setIsAgentStreaming(false);
    emitAuditAiStreamToHost(false);
  }, []);

  // 发送消息到 Agent（支持流式累积）
  const sendMessageToAgent = useCallback(
    async (message: string) => {
      if (!token) {
        setLogs((prev) => [
          ...prev,
          {
            agent: "SYSTEM",
            msg: "Authentication token missing. Please reconnect wallet.",
            type: "error",
          },
        ]);
        return;
      }

      // 确保 session 已初始化
      if (!sessionId.current) {
        try {
          await initSession();
        } catch (err) {
          console.error("Session init failed:", err);
          setLogs((prev) => [
            ...prev,
            {
              agent: "SYSTEM",
              msg: `Failed to initialize session: ${err instanceof Error ? err.message : "Unknown error"}`,
              type: "error",
            },
          ]);
          return;
        }
      }

      if (!sessionId.current) {
        setLogs((prev) => [
          ...prev,
          {
            agent: "SYSTEM",
            msg: "Session ID is still undefined after initialization.",
            type: "error",
          },
        ]);
        return;
      }

      // 关闭之前的连接
      closeEventSource();

      // 构建 URL
      const url = new URL("/api/chat/stream", window.location.origin);
      url.searchParams.set("sessionId", sessionId.current);
      url.searchParams.set("message", message);
      url.searchParams.set("token", token);

      const es = new EventSource(url.toString());
      eventSourceRef.current = es;
      setIsAgentStreaming(true);
      emitAuditAiStreamToHost(true);

      // ---- 流式累积变量 ----
      let currentAgent = ""; // 当前回复的 agent
      let isFirstChunk = true; // 是否是第一个数据块

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 结束标记：关闭连接，不产生新日志
          if (data.status === "end") {
            endAgentStream();
            es.close();
            eventSourceRef.current = null;
            return;
          }

          // 错误标记：直接记录错误日志（独立一条），并重置累积状态
          if (data.status === "error") {
            setLogs((prev) => [
              ...prev,
              {
                agent: data.agent || "SYSTEM",
                msg: data.content || "Unknown error",
                type: "error",
              },
            ]);
            // 如果错误是未授权，重置 sessionId
            if (data.content?.includes("Unauthorized")) {
              sessionId.current = undefined;
            }
            endAgentStream();
            es.close();
            eventSourceRef.current = null;
            return;
          }

          // 正常数据块处理
          if (isFirstChunk) {
            // 第一个数据块：新增日志条目
            currentAgent = data.agent || "AGENT";
            setLogs((prev) => [
              ...prev,
              {
                agent: currentAgent,
                msg: data.content || "",
                type: data.status === "done" ? "success" : "normal",
              },
            ]);
            isFirstChunk = false;
          } else {
            // 后续数据块：追加到当前日志的最后一条
            setLogs((prev) => {
              const newLogs = [...prev];
              const lastLog = newLogs[newLogs.length - 1];
              // 确保 agent 一致（防止意外切换）
              if (lastLog && lastLog.agent === currentAgent) {
                lastLog.msg += data.content || "";
                // 如果状态变为完成，可更新类型（可选）
                if (data.status === "done" && lastLog.type !== "success") {
                  lastLog.type = "success";
                }
              } else {
                // 容错：如果 agent 变化，则新增日志
                newLogs.push({
                  agent: data.agent || "AGENT",
                  msg: data.content || "",
                  type: data.status === "done" ? "success" : "normal",
                });
                currentAgent = data.agent || "AGENT";
              }
              return newLogs;
            });
          }
        } catch (e) {
          console.error("Failed to parse event data:", e);
        }
      };

      es.onerror = (err) => {
        console.error("EventSource error:", err);
        endAgentStream();
        es.close();
        eventSourceRef.current = null;
        setLogs((prev) => [
          ...prev,
          {
            agent: "SYSTEM",
            msg: "Connection lost. Please try again.",
            type: "error",
          },
        ]);
        sessionId.current = undefined; // 重置 session，尝试重新初始化
      };
    },
    [token, initSession, closeEventSource, endAgentStream],
  );

  // 组件卸载时关闭连接并通知宿主恢复背景
  useEffect(() => {
    return () => {
      closeEventSource();
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
    logs,
    sendMessageToAgent,
  };
}
