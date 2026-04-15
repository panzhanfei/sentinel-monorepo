import { NextRequest } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import {
  dualAuthUnauthorizedJson,
  proxyHeadersToNode,
} from "@/app/src/utils/bffProxy";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const jobId = searchParams.get("jobId");

  if (!address || !jobId) {
    return new Response("Missing address or jobId", { status: 400 });
  }

  const unauthorized = await dualAuthUnauthorizedJson(request);
  if (unauthorized) return unauthorized;

  try {
    const nodeRes = await fetch(
      `${NODE_SERVICE}/scan/stream?address=${encodeURIComponent(address)}&jobId=${encodeURIComponent(jobId)}`,
      {
        headers: proxyHeadersToNode(request, {
          contentType: false,
          accept: "text/event-stream",
        }),
      },
    );

    if (!nodeRes.ok) {
      // 如果 Node 服务返回错误，尝试读取错误信息并返回
      const errorText = await nodeRes.text();
      return new Response(errorText, { status: nodeRes.status });
    }

    if (!nodeRes.body) {
      return new Response("No stream available from upstream", { status: 502 });
    }

    // 创建可读流，将 Node 的数据实时转发
    const stream = new ReadableStream({
      async start(controller) {
        const reader = nodeRes.body!.getReader();
        const onAbort = () => {
          reader.cancel().catch(() => {});
        };
        request.signal.addEventListener("abort", onAbort);
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (request.signal.aborted) break;
            try {
              controller.enqueue(value);
            } catch {
              await reader.cancel().catch(() => {});
              break;
            }
          }
          try {
            controller.close();
          } catch {
            /* 客户端已断开时 controller 可能已关闭 */
          }
        } catch (err) {
          console.error("Stream read error:", err);
          try {
            controller.error(
              err instanceof Error ? err : new Error(String(err)),
            );
          } catch {
            /* controller 已关闭时忽略 */
          }
        } finally {
          request.signal.removeEventListener("abort", onAbort);
          try {
            reader.releaseLock();
          } catch {
            /* ignore */
          }
        }
      },
    });

    // 返回 SSE 标准响应头
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("BFF Stream Error:", error);
    return new Response("Node Service Unreachable", { status: 502 });
  }
}
