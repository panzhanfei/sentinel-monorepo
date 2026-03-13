import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 构建请求头
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = request.cookies.get("token")?.value;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${NODE_SERVICE}/scan`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    // 尝试解析响应 JSON，如果失败则返回空对象
    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: "Upstream returned non-JSON response" };
    }

    // 透传上游状态码
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF Scan Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
