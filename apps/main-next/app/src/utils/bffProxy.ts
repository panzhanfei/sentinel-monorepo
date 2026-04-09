import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateDualSession } from "@/lib/authSession";

/**
 * Access：Authorization Bearer → Cookie accessToken → 旧版 Cookie token → ?token=
 */
export function resolveBearerToken(request: NextRequest): string | undefined {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  if (auth?.trim()) return auth.trim();

  const access =
    request.cookies.get("accessToken")?.value ??
    request.cookies.get("token")?.value;
  if (access) return access;

  return request.nextUrl.searchParams.get("token") ?? undefined;
}

export function resolveRefreshTokenCookie(
  request: NextRequest,
): string | undefined {
  return request.cookies.get("refreshToken")?.value ?? undefined;
}

/** BFF 侧会话前置校验：双 token + 黑名单 + 单点登录 */
export async function dualAuthUnauthorizedJson(
  request: NextRequest,
): Promise<NextResponse | null> {
  const accessToken = resolveBearerToken(request);
  const refreshToken = resolveRefreshTokenCookie(request);
  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: "Unauthorized", code: "DUAL_TOKEN_REQUIRED" },
      { status: 401 },
    );
  }

  const validation = await validateDualSession({ accessToken, refreshToken });
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.message, code: validation.code },
      { status: validation.status },
    );
  }

  return null;
}

export type ProxyToNodeHeadersOpts = {
  contentType?: string | false;
  accept?: string;
};

/** 转发 Authorization + 原始 Cookie（含 refreshToken），供 Node 双令牌校验 */
export function proxyHeadersToNode(
  request: NextRequest,
  opts?: ProxyToNodeHeadersOpts,
): HeadersInit {
  const headers = new Headers();
  if (opts?.accept) {
    headers.set("Accept", opts.accept);
  }
  if (opts?.contentType !== false) {
    headers.set("Content-Type", opts?.contentType ?? "application/json");
  }
  const token = resolveBearerToken(request);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("Cookie", cookie);
  }
  return headers;
}

export function authHeadersForProxy(request: NextRequest): HeadersInit {
  return proxyHeadersToNode(request);
}

export async function parseUpstreamJson(res: Response): Promise<unknown> {
  const raw = await res.text();
  const trimmed = raw.trim();

  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return {
      error: "Upstream returned non-JSON response",
      status: res.status,
      contentType: res.headers.get("content-type") ?? undefined,
    };
  }
}
