import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@sentinel/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.toLowerCase();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    // 核心修复：通过关联的 user 模型来匹配 address
    const latestJob = await prisma.job.findFirst({
      where: {
        user: {
          address: address, // 在 User 表里匹配 address
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        progress: true,
        result: true,
        error: true,
      },
    });

    if (!latestJob) {
      return NextResponse.json({ status: "IDLE" });
    }

    return NextResponse.json(latestJob);
  } catch (error) {
    console.error("Status check failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
