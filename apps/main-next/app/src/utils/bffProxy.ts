import type { NextRequest } from "next/server";

/** Cookie、Authorization 头或 URL ?token= 与 Node 端 auth 中间件对齐 */
export function resolveBearerToken(request: NextRequest): string | undefined {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  if (auth?.trim()) return auth.trim();
  const cookie = request.cookies.get("token")?.value;
  if (cookie) return cookie;
  return request.nextUrl.searchParams.get("token") ?? undefined;
}

export function authHeadersForProxy(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = resolveBearerToken(request);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
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
