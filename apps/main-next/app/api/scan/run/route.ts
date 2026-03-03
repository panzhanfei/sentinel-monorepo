import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address)
      return NextResponse.json({ error: "Address required" }, { status: 400 });

    const cleanAddress = address.toLowerCase();
    const taskKey = `sentinel:task:${cleanAddress}`;

    // 1. 检查幂等性：避免重复扫描
    const status = await redis.hget(taskKey, "status");
    if (status === "pending" || status === "processing") {
      return NextResponse.json({ message: "Task active", status });
    }

    // 2. 初始化任务元数据 (Hash 结构)
    // 为什么要用 Hash？因为后续 AI 扫描进度、风险分需要高频更新，Hash 比 JSON 字符串性能好得多
    await redis.hset(taskKey, {
      address: cleanAddress,
      status: "pending",
      progress: "0",
      createdAt: Date.now().toString(),
    });

    // 3. 派发任务 (List 结构)
    // RPUSH 将任务推入队列末尾
    await redis.rpush("sentinel:queue", cleanAddress);

    return NextResponse.json({ success: true, address: cleanAddress });
  } catch (error) {
    console.error("Next.js API Redis Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
