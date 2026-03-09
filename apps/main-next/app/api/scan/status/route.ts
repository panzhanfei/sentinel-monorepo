import { NextResponse } from "next/server";
import { prisma } from "@sentinel/database";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.toLowerCase();
    if (!address)
      return NextResponse.json({ error: "Address required" }, { status: 400 });

    const taskKey = `sentinel:task:${address}`;

    // 1. 尝试从缓存获取（应对前端 1s/次的轮询频率）
    const cacheData = await redis.hgetall(taskKey);
    if (cacheData && Object.keys(cacheData).length > 0) {
      return NextResponse.json({
        status: cacheData.status,
        progress: parseInt(cacheData.progress || "0"),
        source: "cache",
      });
    }

    // 2. 缓存失效时，从数据库获取最新一条记录
    const latestJob = await prisma.job.findFirst({
      where: { user: { address } },
      orderBy: { createdAt: "desc" },
    });

    if (!latestJob) return NextResponse.json({ status: "not_found" });

    // 3. 将数据库结果回填缓存（平滑过渡）
    await redis.hset(taskKey, {
      status: latestJob.status,
      progress: latestJob.progress.toString(),
    });

    return NextResponse.json({
      status: latestJob.status,
      progress: latestJob.progress,
      result: latestJob.result,
      source: "database",
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
