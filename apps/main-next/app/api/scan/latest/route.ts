import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const token = request.cookies.get("token")?.value;
  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  try {
    // 构建请求头：只在有 Authorization 时才添加
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = token;
    }

    const targetUrl = `${NODE_SERVICE}/scan/latest?address=${encodeURIComponent(address)}`;
    // 便于调试

    const res = await fetch(targetUrl, {
      cache: "no-store",
      headers,
    });

    // 尝试解析响应 JSON
    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: "Invalid JSON from upstream" };
    }

    // 透传上游状态码
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[API] /scan/latest fetch error:", error);
    return NextResponse.json(
      { error: "Failed to connect to node service" },
      { status: 502 }, // Bad Gateway
    );
  }
}
