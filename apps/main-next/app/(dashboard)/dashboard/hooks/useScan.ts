import { useState, useRef, useCallback, useEffect } from "react";
import { type Address } from "viem";
import type { ScanStatus, ScanResultData, AgentMessage } from "./types";

export function useScan({
  enabled,
  address,
}: {
  enabled: boolean;
  address?: Address;
}) {
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("IDLE");
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentMessage[]>([]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobId = useRef<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const closeSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  // 轮询 job 状态
  const checkJobStatus = useCallback(async () => {
    if (!currentJobId.current) return;
    try {
      const response = await fetch(`/api/scan/${currentJobId.current}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Fetch status failed");
      const data = await response.json();

      if (data.status) {
        setScanStatus(data.status);
        setScanProgress(data.progress || 0);

        if (data.status === "COMPLETED") {
          setScanResult(data.result);
          stopPolling();
          closeSSE();
        } else if (data.status === "FAILED") {
          stopPolling();
          closeSSE();
        }
      }
    } catch (e) {
      console.error("Polling error:", e);
      setScanStatus("FAILED");
      stopPolling();
      closeSSE();
    }
  }, [stopPolling, closeSSE]);

  // 初始化：获取历史记录并恢复运行中的任务
  useEffect(() => {
    if (!enabled || !address) return;

    const init = async () => {
      try {
        const res = await fetch(`/api/scan/latest?address=${address}`);
        if (res.ok) {
          const job = await res.json();
          if (
            job?.id &&
            (job.status === "PENDING" || job.status === "RUNNING")
          ) {
            // 恢复正在进行的任务
            setScanStatus(job.status);
            setScanProgress(job.progress || 0);
            currentJobId.current = job.id;

            // 关闭可能存在的旧连接
            closeSSE();
            stopPolling();

            // 重新连接 SSE
            const sse = new EventSource(
              `/api/scan/stream?address=${address}&jobId=${job.id}`,
            );
            sseRef.current = sse;

            sse.onmessage = (event) => {
              try {
                const data: AgentMessage = JSON.parse(event.data);
                setAgentLogs((prev) => {
                  const lastIndex = prev.length - 1;
                  const last = lastIndex >= 0 ? prev[lastIndex] : null;
                  if (
                    last &&
                    last.agent === data.agent &&
                    last.status === "thinking"
                  ) {
                    if (data.status === "thinking") {
                      const updated = [...prev];
                      updated[lastIndex] = {
                        ...last,
                        content: last.content + data.content,
                      };
                      return updated;
                    } else if (
                      data.status === "done" ||
                      data.status === "error"
                    ) {
                      const updated = [...prev];
                      updated[lastIndex] = {
                        ...last,
                        status: data.status,
                        content: data.content || last.content,
                      };
                      return updated;
                    }
                  }
                  return [...prev, data];
                });
              } catch (e) {
                console.error("Parse SSE error:", e);
              }
            };

            sse.addEventListener("end", () => {
              sse.close();
              sseRef.current = null;
            });
            sse.onerror = () => {
              sse.close();
              sseRef.current = null;
            };

            // 重新启动轮询
            pollIntervalRef.current = setInterval(checkJobStatus, 1500);
          } else if (job?.status === "COMPLETED" && job?.result) {
            // 已完成的任务直接显示结果
            setScanResult(job.result);
            setScanStatus("COMPLETED");
            setScanProgress(100);
          }
          // 其他状态（FAILED 或无任务）保持 IDLE
        }
      } catch (e) {
        console.error("Init failed:", e);
      }
    };

    init();
  }, [enabled, address, closeSSE, stopPolling, checkJobStatus]);

  // 发起深度扫描
  const handleRunDeepScan = useCallback(async () => {
    if (
      !enabled ||
      !address ||
      scanStatus === "PENDING" ||
      scanStatus === "RUNNING"
    )
      return;

    closeSSE();
    stopPolling();

    setScanStatus("PENDING");
    setScanProgress(0);
    setScanResult(null);
    setAgentLogs([]);
    currentJobId.current = null;

    try {
      const startRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!startRes.ok) throw new Error("Failed to start scan");

      const { jobId } = await startRes.json();
      if (jobId) {
        currentJobId.current = jobId;
        pollIntervalRef.current = setInterval(checkJobStatus, 1500);

        const sse = new EventSource(
          `/api/scan/stream?address=${address}&jobId=${jobId}`,
        );
        sseRef.current = sse;

        sse.onmessage = (event) => {
          try {
            const data: AgentMessage = JSON.parse(event.data);
            setAgentLogs((prev) => {
              const lastIndex = prev.length - 1;
              const last = lastIndex >= 0 ? prev[lastIndex] : null;
              if (
                last &&
                last.agent === data.agent &&
                last.status === "thinking"
              ) {
                if (data.status === "thinking") {
                  const updated = [...prev];
                  updated[lastIndex] = {
                    ...last,
                    content: last.content + data.content,
                  };
                  return updated;
                } else if (data.status === "done" || data.status === "error") {
                  const updated = [...prev];
                  updated[lastIndex] = {
                    ...last,
                    status: data.status,
                    content: data.content || last.content,
                  };
                  return updated;
                }
              }
              return [...prev, data];
            });
          } catch (e) {
            console.error("Parse SSE error:", e);
          }
        };

        sse.addEventListener("end", () => {
          sse.close();
          sseRef.current = null;
        });
        sse.onerror = () => {
          sse.close();
          sseRef.current = null;
        };
      }
    } catch (err) {
      console.error("Scan flow error:", err);
      setScanStatus("FAILED");
    }
  }, [enabled, address, scanStatus, closeSSE, stopPolling, checkJobStatus]);

  // 清理
  useEffect(() => {
    return () => {
      stopPolling();
      closeSSE();
    };
  }, [stopPolling, closeSSE]);

  const suspiciousCount = scanResult?.details?.riskCount || 0;
  const scanLoading = scanStatus === "PENDING" || scanStatus === "RUNNING";

  return {
    scanProgress,
    scanStatus,
    scanResult,
    agentLogs,
    suspiciousCount,
    scanLoading,
    handleRunDeepScan,
  };
}
