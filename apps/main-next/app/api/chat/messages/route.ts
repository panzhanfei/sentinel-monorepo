import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import {
  authHeadersForProxy,
  dualAuthUnauthorizedJson,
  parseUpstreamJson,
} from "@/app/src/utils/bffProxy";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = request.nextUrl;
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    const unauthorized = await dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;

    const limit = searchParams.get("limit") ?? "5";
    const before = searchParams.get("before");

    const qs = new URLSearchParams({
      sessionId,
      limit,
    });
    if (before) {
      qs.set("before", before);
    }

    const res = await fetch(`${NODE_SERVICE}/chat/messages?${qs.toString()}`, {
      method: "GET",
      headers: authHeadersForProxy(request),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF chat/messages Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
