import { NextResponse } from "next/server";
import { prisma } from "@sentinel/database";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!address)
      return NextResponse.json({ error: "Address required" }, { status: 400 });

    const cleanAddress = address.toLowerCase();
    const taskKey = `sentinel:task:${cleanAddress}`;

    // 1. 幂等性检查：如果该地址已有活跃任务，直接返回
    const activeJob = await prisma.job.findFirst({
      where: {
        user: { address: cleanAddress },
        status: { in: ["PENDING", "RUNNING"] },
      },
    });

    if (activeJob) {
      return NextResponse.json({
        jobId: activeJob.id,
        message: "Task already active",
      });
    }

    // 2. 确保用户存在 (Upsert)
    const user = await prisma.user.upsert({
      where: { address: cleanAddress },
      update: {},
      create: { address: cleanAddress },
    });

    // 3. 创建持久化任务记录
    const job = await prisma.job.create({
      data: {
        userId: user.id,
        type: "SECURITY_SCAN",
        status: "PENDING",
        progress: 0,
      },
    });

    // 4. 初始化 Redis 状态（供前端 GET 接口秒回，解决 0 进度闪烁）
    await redis.hset(taskKey, {
      jobId: job.id,
      address: cleanAddress,
      status: "PENDING",
      progress: "0",
    });
    await redis.expire(taskKey, 3600); // 1小时缓存

    // 5. 派发任务到队列
    await redis.lpush(
      "sentinel:scan_queue",
      JSON.stringify({ jobId: job.id, address: cleanAddress }),
    );

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error("Scan API Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
