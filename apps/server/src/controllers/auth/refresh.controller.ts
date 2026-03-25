import type { Request, Response } from 'express';
import { dualJwt } from '@/lib/dualJwt';
import { sendFailure, sendSuccess } from '@/utils/apiResponse';

/**
 * 仅校验 Refresh Token，签发新的 access + refresh（旋转刷新令牌）。
 * 不经过双令牌中间件，供 access 过期后续期。
 */
export function refreshTokens(req: Request, res: Response) {
  const refreshToken =
    req.cookies?.refreshToken ??
    (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined) ??
    (typeof req.query?.refresh_token === 'string'
      ? req.query.refresh_token
      : undefined);

  if (!refreshToken) {
    return sendFailure(res, 401, 'Missing refresh token', 'MISSING_REFRESH');
  }

  try {
    const payload = dualJwt.verifyRefresh(refreshToken);
    const { accessToken, refreshToken: nextRefresh } = dualJwt.generatePair({
      sub: payload.sub,
      role: typeof payload.role === 'string' ? payload.role : undefined,
    });
    return sendSuccess(res, { accessToken, refreshToken: nextRefresh });
  } catch {
    return sendFailure(res, 401, 'Invalid refresh token', 'INVALID_REFRESH');
  }
}
