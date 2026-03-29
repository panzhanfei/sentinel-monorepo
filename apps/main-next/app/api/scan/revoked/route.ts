import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import {
  authHeadersForProxy,
  dualAuthUnauthorizedJson,
  parseUpstreamJson,
} from "@/app/src/utils/bffProxy";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const res = await fetch(`${NODE_SERVICE}/scan/revoked`, {
      method: "POST",
      headers: authHeadersForProxy(request),
      body: JSON.stringify(body),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF Revoke Record Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
