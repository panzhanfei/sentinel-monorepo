import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@sentinel/database";
import { batchAuditAllowances, AllowanceResult } from "@sentinel/security-sdk";
import { Address } from "viem";
import { generateAIVerdict } from "./ai-service";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

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

    runSecurityScan(job.id, address.toLowerCase() as Address).catch((err) => {
      console.error(`[Security Worker] Job ${job.id} failed:`, err);
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to start scan" },
      { status: 500 },
    );
  }
}

async function runSecurityScan(jobId: string, address: Address) {
  try {
    // --- 1. 初始化 & 开始链上扫描 ---
    console.log(`[Security Worker] Starting scan for ${address}`);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "RUNNING", progress: 10 },
    });

    // 💡 动态扫描：这一步现在会自动抓取你在 Remix/Anvil 里的所有授权记录
    const allowances: AllowanceResult[] = await batchAuditAllowances(address);
    console.log(
      `🚀 [Security Worker] Job ${jobId} fetched ${allowances.length} allowances.`,
    );

    if (allowances.length === 0) {
      // 没有任何授权，直接标记为完成
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
      // 扫描完成，进度推到 40%
      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 40 },
      });

      // --- 2. AI 诊断阶段 ---
      // 给用户一点“AI 正在思考”的反馈感，避免进度条闪现
      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 60 },
      });

      // 💡 传递扫描到的授权数据给 AI
      const aiVerdict = await generateAIVerdict(address, allowances);

      // AI 诊断结束，进度推到 85%
      await prisma.job.update({
        where: { id: jobId },
        data: { progress: 85 },
      });

      // --- 3. 结果筛选与持久化 ---
      // 过滤出真正有风险的（授权额度 > 0）
      const activeRisks = allowances.filter(
        (a) => BigInt(a.rawAllowance) > BigInt(0),
      );

      // 最后更新：状态改为 COMPLETED，进度 100%
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
            allowances: allowances, // 保存全量数据，方便前端展示
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
        progress: 0, // 失败后进度归零
        error:
          error instanceof Error
            ? error.message
            : "Blockchain connection failed",
      },
    });
  }
}
