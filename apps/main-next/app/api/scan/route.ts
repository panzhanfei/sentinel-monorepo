import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@sentinel/database";
import { batchAuditAllowances, AllowanceResult } from "@sentinel/security-sdk";
import { Address } from "viem";
import { generateAIVerdict } from "./ai-service";
import { IdempotencyService } from "@sentinel/auth"; // 新增导入
import { redis } from "@/lib/redis"; // 从你的 redis 实例导入，路径根据实际调整

// 初始化幂等服务
const idempotency = new IdempotencyService(redis, {
  prefix: "idempotency:scan",
  ttl: 60 * 60 * 24, // 24小时
});

export async function POST(request: NextRequest) {
  try {
    const { address, requestId } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required for idempotency" },
        { status: 400 },
      );
    }

    // --- 幂等性检查：尝试获取锁 ---
    const lockKey = `scan:${requestId}`;
    const lockAcquired = await idempotency.tryAcquire(lockKey);
    if (!lockAcquired) {
      // 锁已存在，说明该 requestId 已提交过
      // 可选：尝试获取已有的 jobId（如果锁的 value 已更新为 jobId）
      const existingJobId = await redis.get(`idempotency:scan:${lockKey}`);
      if (existingJobId && existingJobId !== "pending") {
        return NextResponse.json(
          { error: "Duplicate request", jobId: existingJobId },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Duplicate request, please wait or use a new requestId" },
        { status: 409 },
      );
    }

    // 锁获取成功，继续处理
    const user = await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      update: {},
      create: { address: address.toLowerCase() },
    });

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        type: "SCAN_SECURITY",
        status: "PENDING",
        progress: 0,
      },
    });

    // 将幂等锁的值更新为真正的 jobId（覆盖 pending）
    await redis.set(`idempotency:scan:${lockKey}`, job.id, "EX", 60 * 60 * 24);

    // 触发后台扫描（不等待）
    runSecurityScan(job.id, address.toLowerCase() as Address).catch((err) => {
      console.error(`[Security Worker] Job ${job.id} failed:`, err);
      // 如果扫描失败，可以选择删除幂等锁，允许重试
      // 但通常保留锁，让客户端用新的 requestId 重试
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    // 发生错误时，需要释放幂等锁，否则该 requestId 永远无法重试
    const { requestId } = await request.json().catch(() => ({}));
    if (requestId) {
      await redis.del(`idempotency:scan:${requestId}`).catch(console.error);
    }
    return NextResponse.json(
      { error: "Failed to start scan" },
      { status: 500 },
    );
  }
}

// 原有的 runSecurityScan 函数保持不变
async function runSecurityScan(jobId: string, address: Address) {
  try {
    // --- 1. 初始化 & 开始链上扫描 ---
    console.log(`[Security Worker] Starting scan for ${address}`);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "RUNNING", progress: 10 },
    });

    const allowances: AllowanceResult[] = await batchAuditAllowances(address);
    console.log(
      `🚀 [Security Worker] Job ${jobId} fetched ${allowances.length} allowances.`,
    );

    if (allowances.length === 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          result: {
            risk: "LOW",
            allowances: [],
            details: {
              riskCount: 0,
              message: "No active allowances found. Great job!",
              timestamp: Date.now(),
            },
          } as unknown as Prisma.JsonObject,
        },
      });
      return;
    } else {
      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 40 },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 60 },
      });

      const aiVerdict = await generateAIVerdict(address, allowances);

      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 85 },
      });

      const activeRisks = allowances.filter(
        (a) => BigInt(a.rawAllowance) > BigInt(0),
      );

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          result: {
            risk:
              activeRisks.length > 5
                ? "HIGH"
                : activeRisks.length > 0
                  ? "MEDIUM"
                  : "LOW",
            allowances: allowances,
            details: {
              riskCount: activeRisks.length,
              message: aiVerdict,
              timestamp: Date.now(),
            },
          } as unknown as Prisma.JsonObject,
        },
      });
    }
  } catch (error) {
    console.error(`[Security Worker] Job ${jobId} Error:`, error);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        progress: 0,
        error:
          error instanceof Error
            ? error.message
            : "Blockchain connection failed",
      },
    });
    // 注意：不在这里释放幂等锁，让客户端决定是否重试（用新 requestId）
  }
}
