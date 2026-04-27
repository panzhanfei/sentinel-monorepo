import { getBffBaseUrl } from "./bffOrigin";

/**
 * 与 main-next `authFetch` 对齐：子应用跨域请求宿主 BFF 时，access 过期可通过 refresh 恢复；
 * 若未先 refresh 会直接 401 并触发宿主踢出。
 */
const parseErrorCode = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  if (typeof o.code === "string") return o.code;
  const err = o.error;
  if (err && typeof err === "object") {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string") return c;
  }
  return undefined;
};

const shouldAttemptRefresh = (code: string | undefined): boolean => {
  return (
    code === "INVALID_TOKEN" ||
    code === "TOKEN_SUBJECT_MISMATCH" ||
    code === "TOKEN_BLACKLISTED" ||
    code === "SESSION_REVOKED" ||
    code === "TOKEN_SESSION_MISMATCH"
  );
};

let refreshInFlight: Promise<boolean> | null = null;

const tryRefreshSession = (bffBase: string): Promise<boolean> => {
  if (refreshInFlight) return refreshInFlight;
  const url = `${bffBase.replace(/\/$/, "")}/api/auth/refresh`;
  const p = fetch(url, { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false);
  refreshInFlight = p;
  void p.finally(() => {
    if (refreshInFlight === p) refreshInFlight = null;
  });
  return p;
};

/**
 * 对宿主 BFF 的 credentialed fetch；401 且为可刷新错误码时先 POST refresh 再重试一次。
 */
export const bffFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const bffBase = getBffBaseUrl();
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

  if (href.includes("/api/auth/refresh")) {
    return fetch(input, nextInit);
  }

  const run = () => fetch(input, nextInit);
  const res = await run();
  if (res.status !== 401) return res;

  let body: unknown = null;
  try {
    if (typeof res.clone === "function") {
      body = await res.clone().json();
    } else if (typeof (res as Response).json === "function") {
      body = await (res as Response).json();
    }
  } catch {
    body = null;
  }
  if (!shouldAttemptRefresh(parseErrorCode(body))) return res;

  const refreshed = await tryRefreshSession(bffBase);
  if (!refreshed) return res;
  return run();
};
