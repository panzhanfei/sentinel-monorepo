import { createHash, randomUUID } from "node:crypto";
import { DualJwtService, type DualJwtOptions, type JwtPayload } from "@sentinel/auth";
import { redis } from "@/lib/redis";

const ACCESS_COOKIE_MAX_AGE_SEC = 15 * 60;
const REFRESH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;
const BLACKLIST_PREFIX = "auth:blacklist";
const ACTIVE_SESSION_PREFIX = "auth:active-session";

type SessionClaims = JwtPayload & {
  exp?: number;
  sid?: string;
};

const dualJwtOptions: DualJwtOptions = {
  accessSecret: process.env.JWT_SECRET!,
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET ??
    "your-refresh-token-secret-different-from-jwt",
  accessExpiresIn: (process.env.JWT_EXPIRES_IN ??
    "15m") as DualJwtOptions["accessExpiresIn"],
  refreshExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN ??
    "7d") as DualJwtOptions["refreshExpiresIn"],
};

const dualJwt = new DualJwtService(dualJwtOptions);

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function blacklistKey(token: string): string {
  return `${BLACKLIST_PREFIX}:${tokenHash(token)}`;
}

function activeSessionKey(sub: string): string {
  return `${ACTIVE_SESSION_PREFIX}:${sub.toLowerCase()}`;
}

function ttlFromClaims(payload?: SessionClaims): number {
  if (!payload?.exp || typeof payload.exp !== "number") return 1;
  const ttl = payload.exp - Math.floor(Date.now() / 1000);
  return ttl > 0 ? ttl : 1;
}

async function setBlacklist(token: string, payload?: SessionClaims): Promise<void> {
  await redis.set(blacklistKey(token), "1", "EX", ttlFromClaims(payload));
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const exists = await redis.exists(blacklistKey(token));
  return exists === 1;
}

async function revokeToken(
  token: string | undefined,
  kind: "access" | "refresh",
): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const payload =
      kind === "access"
        ? (dualJwt.verifyAccess(token) as SessionClaims)
        : (dualJwt.verifyRefresh(token) as SessionClaims);
    await setBlacklist(token, payload);
    return payload;
  } catch {
    return null;
  }
}

export async function issueLoginTokens(params: {
  sub: string;
  role?: string;
  prevAccessToken?: string;
  prevRefreshToken?: string;
}) {
  const sub = params.sub.toLowerCase();
  const sid = randomUUID();

  await Promise.all([
    revokeToken(params.prevAccessToken, "access"),
    revokeToken(params.prevRefreshToken, "refresh"),
  ]);

  await redis.set(activeSessionKey(sub), sid, "EX", REFRESH_COOKIE_MAX_AGE_SEC);

  const { accessToken, refreshToken } = dualJwt.generatePair({
    sub,
    role: params.role,
    sid,
  });

  return { accessToken, refreshToken, sid };
}

export async function rotateTokens(params: {
  accessToken: string;
  refreshToken: string;
}): Promise<
  | {
      ok: true;
      accessToken: string;
      refreshToken: string;
    }
  | {
      ok: false;
      code: string;
      status: number;
      message: string;
    }
> {
  const result = await validateDualSession(params);
  if (!result.ok) return result;

  await Promise.all([
    setBlacklist(params.accessToken, result.accessPayload),
    setBlacklist(params.refreshToken, result.refreshPayload),
    redis.set(
      activeSessionKey(result.sub),
      result.sid,
      "EX",
      REFRESH_COOKIE_MAX_AGE_SEC,
    ),
  ]);

  const { accessToken, refreshToken } = dualJwt.generatePair({
    sub: result.sub,
    role: result.role,
    sid: result.sid,
  });

  return { ok: true, accessToken, refreshToken };
}

export async function revokeSession(params: {
  accessToken?: string;
  refreshToken?: string;
}): Promise<void> {
  const [accessPayload, refreshPayload] = await Promise.all([
    revokeToken(params.accessToken, "access"),
    revokeToken(params.refreshToken, "refresh"),
  ]);

  const payload = refreshPayload ?? accessPayload;
  const sub = typeof payload?.sub === "string" ? payload.sub.toLowerCase() : null;
  const sid = typeof payload?.sid === "string" ? payload.sid : null;
  if (!sub || !sid) return;

  const key = activeSessionKey(sub);
  const activeSid = await redis.get(key);
  if (activeSid === sid) {
    await redis.del(key);
  }
}

export async function validateDualSession(params: {
  accessToken: string;
  refreshToken: string;
}): Promise<
  | {
      ok: true;
      sub: string;
      role?: string;
      sid: string;
      accessPayload: SessionClaims;
      refreshPayload: SessionClaims;
    }
  | {
      ok: false;
      code: string;
      status: number;
      message: string;
    }
> {
  if (!params.accessToken || !params.refreshToken) {
    return {
      ok: false,
      code: "DUAL_TOKEN_REQUIRED",
      status: 401,
      message: "Unauthorized",
    };
  }

  const [accessBlocked, refreshBlocked] = await Promise.all([
    isTokenBlacklisted(params.accessToken),
    isTokenBlacklisted(params.refreshToken),
  ]);
  if (accessBlocked || refreshBlocked) {
    return {
      ok: false,
      code: "TOKEN_BLACKLISTED",
      status: 401,
      message: "Session revoked",
    };
  }

  let accessPayload: SessionClaims;
  let refreshPayload: SessionClaims;
  try {
    accessPayload = dualJwt.verifyAccess(params.accessToken) as SessionClaims;
    refreshPayload = dualJwt.verifyRefresh(params.refreshToken) as SessionClaims;
  } catch {
    return {
      ok: false,
      code: "INVALID_TOKEN",
      status: 401,
      message: "Invalid token",
    };
  }

  const sub = String(accessPayload.sub ?? "").toLowerCase();
  const refreshSub = String(refreshPayload.sub ?? "").toLowerCase();
  if (!sub || sub !== refreshSub) {
    return {
      ok: false,
      code: "TOKEN_SUBJECT_MISMATCH",
      status: 401,
      message: "Unauthorized",
    };
  }

  const sid = typeof accessPayload.sid === "string" ? accessPayload.sid : "";
  const refreshSid =
    typeof refreshPayload.sid === "string" ? refreshPayload.sid : "";
  if (!sid || sid !== refreshSid) {
    return {
      ok: false,
      code: "TOKEN_SESSION_MISMATCH",
      status: 401,
      message: "Unauthorized",
    };
  }

  const currentSid = await redis.get(activeSessionKey(sub));
  if (!currentSid || currentSid !== sid) {
    return {
      ok: false,
      code: "SESSION_REVOKED",
      status: 401,
      message: "Session revoked",
    };
  }

  return {
    ok: true,
    sub,
    sid,
    role: typeof accessPayload.role === "string" ? accessPayload.role : undefined,
    accessPayload,
    refreshPayload,
  };
}

export const authCookieConfig = {
  accessMaxAge: ACCESS_COOKIE_MAX_AGE_SEC,
  refreshMaxAge: REFRESH_COOKIE_MAX_AGE_SEC,
};
