import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/config";
import {
  authHeadersForProxy,
  dualAuthUnauthorizedJson,
  parseUpstreamJson,
} from "@/lib";

export const GET = async (request: NextRequest) => {
  try {
    const address = request.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { error: "address is required (query param)" },
        { status: 400 },
      );
    }
    const unauthorized = await dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;

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

export const POST = async (request: NextRequest) => {
  try {
    const unauthorized = await dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;

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
