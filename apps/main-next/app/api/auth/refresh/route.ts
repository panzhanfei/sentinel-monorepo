import { NextRequest, NextResponse } from "next/server";
import { NODE_SERVICE } from "@/app/src/config/node_service";
import {
  parseUpstreamJson,
  proxyHeadersToNode,
} from "@/app/src/utils/bffProxy";

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(request: NextRequest) {
  try {
    const res = await fetch(`${NODE_SERVICE}/auth/refresh`, {
      method: "POST",
      headers: proxyHeadersToNode(request),
    });

    const data = (await parseUpstreamJson(res)) as {
      accessToken?: string;
      refreshToken?: string;
      error?: string;
    };

    if (!res.ok || !data.accessToken || !data.refreshToken) {
      return NextResponse.json(
        { error: data.error ?? "Refresh failed", code: "REFRESH_FAILED" },
        { status: res.status >= 400 ? res.status : 401 },
      );
    }

    const out = NextResponse.json({ ok: true });
    out.cookies.set("accessToken", data.accessToken, {
      ...cookieBase,
      maxAge: 15 * 60,
    });
    out.cookies.set("refreshToken", data.refreshToken, {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 7,
    });
    return out;
  } catch (error) {
    console.error("BFF auth/refresh Error:", error);
    return NextResponse.json(
      { error: "Node Service Unreachable" },
      { status: 502 },
    );
  }
}
