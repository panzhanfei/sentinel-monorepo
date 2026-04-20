import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/config/node_service";
import {
  authHeadersForProxy,
  dualAuthUnauthorizedJson,
  parseUpstreamJson,
} from "@/lib/bffProxy";

export const POST = async (request: NextRequest) => {
  try {
    const unauthorized = await dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;

    const body = await request.json();

    const res = await fetch(`${NODE_SERVICE}/scan`, {
      method: "POST",
      headers: authHeadersForProxy(request),
      body: JSON.stringify(body),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF Scan Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
