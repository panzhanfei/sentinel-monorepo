import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateDualSession } from "@/lib/authSession";

const resolveBearerToken = (request: NextRequest) : string | undefined => {
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

const resolveRefreshTokenCookie = (request: NextRequest) : string | undefined => {
  return request.cookies.get("refreshToken")?.value ?? undefined;
}

export const dualAuthUnauthorizedJson = async (request: NextRequest) : Promise<NextResponse | null> => {
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

type ProxyToNodeHeadersOpts = {
  contentType?: string | false;
  accept?: string;
};

export const proxyHeadersToNode = (request: NextRequest, opts?: ProxyToNodeHeadersOpts) : HeadersInit => {
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

export const authHeadersForProxy = (request: NextRequest) : HeadersInit => {
  return proxyHeadersToNode(request);
}

export const parseUpstreamJson = async (res: Response) : Promise<unknown> => {
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
