import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // 复用单例

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address)
    return NextResponse.json({ error: "Address required" }, { status: 400 });

  const taskKey = `sentinel:task:${address.toLowerCase()}`;

  // 从 Redis Hash 中一次性取出 status 和 progress
  const data = await redis.hgetall(taskKey);

  if (!data || Object.keys(data).length === 0) {
    return NextResponse.json({ status: "not_found" });
  }

  return NextResponse.json({
    address: data.address,
    status: data.status, // pending | processing | completed
    progress: parseInt(data.progress || "0"),
    riskScore: data.riskScore || 0,
  });
}
