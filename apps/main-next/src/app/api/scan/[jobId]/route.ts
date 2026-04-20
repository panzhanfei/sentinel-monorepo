import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/config/node_service";
import {
  authHeadersForProxy,
  dualAuthUnauthorizedJson,
  parseUpstreamJson,
} from "@/lib/bffProxy";

export const GET = async (request: NextRequest, context: { params: Promise<{ jobId: string }> }) => {
  try {
    const { jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const unauthorized = await dualAuthUnauthorizedJson(request);
    if (unauthorized) return unauthorized;

    const res = await fetch(`${NODE_SERVICE}/scan/${jobId}`, {
      cache: "no-store", // 必须禁用缓存，确保拿到真实进度
      headers: authHeadersForProxy(request),
    });

    const data = await parseUpstreamJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("BFF Scan Status Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 500 },
    );
  }
}
