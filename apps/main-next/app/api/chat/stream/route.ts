import { NextRequest } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import {
  dualAuthUnauthorizedJson,
  proxyHeadersToNode,
} from "@/app/src/utils/bffProxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const message = searchParams.get("message") ?? "";
  if (!sessionId) {
    return new Response("Missing sessionId ", { status: 400 });
  }
  const unauthorized = dualAuthUnauthorizedJson(request);
  if (unauthorized) return unauthorized;

  try {
    const nodeRes = await fetch(
      `${NODE_SERVICE}/chat/stream?sessionId=${encodeURIComponent(sessionId)}&message=${encodeURIComponent(message)}`,
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
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          console.error("Stream read error:", err);
          controller.error(err);
        } finally {
          controller.close();
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
