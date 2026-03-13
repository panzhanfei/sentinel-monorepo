import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    // 从 cookie 获取 token
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${NODE_SERVICE}/scan/${jobId}`, {
      cache: "no-store", // 必须禁用缓存，确保拿到真实进度
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // 尝试解析响应 JSON
    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: "Upstream returned non-JSON response" };
    }

    // 透传上游状态码
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF Scan Status Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
