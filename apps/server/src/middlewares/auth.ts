// apps/node-app/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@sentinel/auth';

const jwtService = new JwtService({
  secret: process.env.JWT_SECRET!,
});

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 从 Authorization 头或 Cookie 中提取 token

  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.cookies?.token ||
    req.body?.token ||
    req.query?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwtService.verify(token);
    req.user = payload; // 将用户信息挂载到请求对象
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
