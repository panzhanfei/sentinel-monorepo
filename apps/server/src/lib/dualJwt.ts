import type { SignOptions } from 'jsonwebtoken';
import { DualJwtService } from '@sentinel/auth';
import { env } from '@/config';

export const dualJwt = new DualJwtService({
  accessSecret: env.JWT_SECRET,
  refreshSecret: env.REFRESH_TOKEN_SECRET,
  accessExpiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
});
