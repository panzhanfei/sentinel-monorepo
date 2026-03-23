import { NextRequest } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import { resolveBearerToken } from "@/app/src/utils/bffProxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const jobId = searchParams.get("jobId");

  if (!address || !jobId) {
    return new Response("Missing address or jobId", { status: 400 });
  }

  const token = resolveBearerToken(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 请求 Node 服务的流式接口，携带认证头
    const nodeRes = await fetch(
      `${NODE_SERVICE}/scan/stream?address=${encodeURIComponent(address)}&jobId=${encodeURIComponent(jobId)}`,
      {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
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
