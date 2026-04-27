import { createPublicClient, http, parseAbiItem } from "viem";
import { mainnet } from "viem/chains";
import { SseMessage } from "@/types"; // 导入新类型

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = async (request: Request) : Promise<Response> => {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim().toLowerCase();
  if (!address) {
    return new Response("Missing address query param", { status: 400 });
  }

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    return new Response("Missing RPC URL", { status: 500 });
  }

  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });

  let unwatchTransfer: (() => void) | undefined;
  let unwatchApproval: (() => void) | undefined;
  let heartbeatTimer: NodeJS.Timeout;

  const stream = new ReadableStream({
    start: (controller) => {
            // 统一的发送函数：接受 SseMessage 类型，自动从 type 字段提取事件名
            const send = (message: SseMessage) => {
              try {
                const eventName = message.type;
                // 注意：message 中可能包含 bigint，但我们在构造时已经转为 string，所以安全
                const data = JSON.stringify(message);
                controller.enqueue(
                  encoder.encode(`event: ${eventName}\ndata: ${data}\n\n`),
                );
              } catch (e) {
                console.error("SSE Enqueue Error:", e);
              }
            };

            // 发送连接成功消息
            send({ type: "connected", status: "ready", timestamp: Date.now() });

            // 心跳
            heartbeatTimer = setInterval(() => {
              send({ type: "ping", tick: Date.now() });
            }, 15000);

            // 监听 Transfer
            unwatchTransfer = client.watchEvent({
              event: parseAbiItem(
                "event Transfer(address indexed from, address indexed to, uint256 value)",
              ),
              onLogs: (logs) => {
                logs.forEach((log) => {
                  // 确保必要字段存在
                  if (!log.args.from || !log.args.to || !log.blockNumber) return;
                  const from = log.args.from.toLowerCase();
                  const to = log.args.to.toLowerCase();
                  if (from !== address && to !== address) return;
                  send({
                    type: "transfer",
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber.toString(), // bigint → string
                    from: log.args.from,
                    to: log.args.to,
                    value: log.args.value?.toString() || "0",
                  });
                });
              },
            });

            // 监听 Approval
            unwatchApproval = client.watchEvent({
              event: parseAbiItem(
                "event Approval(address indexed owner, address indexed spender, uint256 value)",
              ),
              onLogs: (logs) => {
                logs.forEach((log) => {
                  if (!log.args.owner || !log.args.spender || !log.blockNumber)
                    return;
                  if (log.args.owner.toLowerCase() !== address) return;
                  send({
                    type: "approval",
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber.toString(),
                    owner: log.args.owner,
                    spender: log.args.spender,
                    value: log.args.value?.toString() || "0",
                  });
                });
              },
            });
          },
    cancel: () => {
            console.log("❌ 客户端断开，清理资源...");
            if (unwatchTransfer) unwatchTransfer();
            if (unwatchApproval) unwatchApproval();
            if (heartbeatTimer) clearInterval(heartbeatTimer);
          },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
