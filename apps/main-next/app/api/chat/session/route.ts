import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import {
  authHeadersForProxy,
  parseUpstreamJson,
  resolveBearerToken,
} from "@/app/src/utils/bffProxy";

/** GET：便于浏览器/简单客户端用 ?token=&address= 创建会话（上游仍为 POST） */
export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { error: "address is required (query param)" },
        { status: 400 },
      );
    }
    if (!resolveBearerToken(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${NODE_SERVICE}/chat/session`, {
      method: "POST",
      headers: authHeadersForProxy(request),
      body: JSON.stringify({ address }),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF chat/session GET Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${NODE_SERVICE}/chat/session`, {
      method: "POST",
      headers: authHeadersForProxy(request),
      body: JSON.stringify(body),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF chat/session POST Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
