/**
 * 同源 BFF 请求：401 且为可恢复令牌错误时，单次 POST /api/auth/refresh 后重试原请求。
 */

const REFRESH_PATH = "/api/auth/refresh";

let refreshInFlight: Promise<boolean> | null = null;

function parseErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  if (typeof o.code === "string") return o.code;
  const err = o.error;
  if (err && typeof err === "object") {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string") return c;
  }
  return undefined;
}

/** Access 失效但 Refresh 仍可能有效时尝试续期 */
function shouldAttemptRefresh(code: string | undefined): boolean {
  return code === "INVALID_TOKEN" || code === "TOKEN_SUBJECT_MISMATCH";
}

/**
 * 并发去重：多个 401 同时到达时共用一个 refresh 请求。
 */
export function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const p = fetch(REFRESH_PATH, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => r.ok)
    .catch(() => false);

  refreshInFlight = p;
  void p.finally(() => {
    if (refreshInFlight === p) refreshInFlight = null;
  });
  return p;
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const nextInit: RequestInit = {
    ...init,
    credentials: init?.credentials ?? "include",
  };

  const href =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (href.includes(REFRESH_PATH)) {
    return fetch(input, nextInit);
  }

  const run = () => fetch(input, nextInit);

  let res = await run();
  if (res.status !== 401) return res;

  const body = await res.clone().json().catch(() => null);
  if (!shouldAttemptRefresh(parseErrorCode(body))) return res;

  const refreshed = await tryRefreshSession();
  if (!refreshed) return res;

  return run();
}
