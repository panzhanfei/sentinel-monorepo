import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@sentinel/database";

// 强制动态，防止 Next.js 缓存结果
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  // 核心修复：params 在 TS 类型定义中应当是异步的
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    // 1. 必须 await 才能拿到真实的 jobId
    const { jobId } = await context.params;

    // 2. 防御性检查
    if (!jobId || jobId === "undefined") {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 },
      );
    }

    // 3. 执行数据库查询
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      // 建议只查询必要的字段
      select: {
        id: true,
        status: true,
        progress: true,
        result: true,
        error: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Critical API Error [jobId]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
