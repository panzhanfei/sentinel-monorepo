import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/config/node_service";
import {
  authHeadersForProxy,
  dualAuthUnauthorizedJson,
  parseUpstreamJson,
} from "@/lib/bffProxy";

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const unauthorized = await dualAuthUnauthorizedJson(request);
  if (unauthorized) return unauthorized;

  try {
    const targetUrl = `${NODE_SERVICE}/scan/context?address=${encodeURIComponent(address)}`;
    const res = await fetch(targetUrl, {
      cache: "no-store",
      headers: authHeadersForProxy(request),
    });
    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[API] /scan/context fetch error:", error);
    return NextResponse.json(
      { error: "Failed to connect to node service" },
      { status: 502 },
    );
  }
};
