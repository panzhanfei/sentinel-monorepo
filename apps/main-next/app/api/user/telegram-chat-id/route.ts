import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import {
  authHeadersForProxy,
  dualAuthUnauthorizedJson,
  parseUpstreamJson,
} from "@/app/src/utils/bffProxy";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;
    const res = await fetch(`${NODE_SERVICE}/user/telegram-chat-id`, {
      method: "GET",
      cache: "no-store",
      headers: authHeadersForProxy(request),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[API] GET /user/telegram-chat-id:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const unauthorized = await dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const res = await fetch(`${NODE_SERVICE}/user/telegram-chat-id`, {
      method: "PATCH",
      headers: authHeadersForProxy(request),
      body: JSON.stringify(body),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[API] PATCH /user/telegram-chat-id:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
