import { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from '@sentinel/auth';
import { DualJwtService } from '@sentinel/auth';
import { dualJwt } from '@/lib/dualJwt';

function extractAccessToken(req: Request): string | undefined {
  const fromAuth = DualJwtService.extractBearer(req.headers.authorization);
  if (fromAuth) return fromAuth;

  const fromCookie =
    req.cookies?.accessToken ??
    req.cookies?.token; // 旧版单 cookie，仅作 access 兼容
  if (fromCookie) return fromCookie;

  if (typeof req.body?.token === 'string') return req.body.token;
  if (typeof req.query?.token === 'string') return req.query.token;
  if (typeof req.query?.access_token === 'string') return req.query.access_token;

  return undefined;
}

function extractRefreshToken(req: Request): string | undefined {
  if (req.cookies?.refreshToken) return req.cookies.refreshToken;

  const hdr = req.headers['x-refresh-token'];
  if (typeof hdr === 'string') return hdr;

  if (typeof req.query?.refresh_token === 'string') return req.query.refresh_token;

  return undefined;
}

function sameSubject(a: JwtPayload, b: JwtPayload): boolean {
  const sa = String(a.sub).toLowerCase();
  const sb = String(b.sub).toLowerCase();
  return sa === sb;
}

/**
 * 受保护接口：必须同时提供有效的 Access Token 与 Refresh Token，且 sub 一致。
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = extractAccessToken(req);
  const refreshToken = extractRefreshToken(req);

  if (!accessToken || !refreshToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'DUAL_TOKEN_REQUIRED',
    });
  }

  try {
    const accessPayload = dualJwt.verifyAccess(accessToken);
    const refreshPayload = dualJwt.verifyRefresh(refreshToken);

    if (!sameSubject(accessPayload, refreshPayload)) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'TOKEN_SUBJECT_MISMATCH',
      });
    }

    req.user = accessPayload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
