// app/api/scan/latest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@sentinel/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address)
    return NextResponse.json({ error: "Address required" }, { status: 400 });

  try {
    const latestJob = await prisma.job.findFirst({
      where: {
        user: { address: address.toLowerCase() },
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(latestJob);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
