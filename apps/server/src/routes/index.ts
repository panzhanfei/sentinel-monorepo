import { Router } from 'express';
import authRouter from './scan';
import chatRouter from './chat';
import userRouter from './user';

import { authMiddleware } from '@/middlewares';
import { sendSuccess } from '@/utils/apiResponse';

const router = Router();

router.get('/api/v1', (_req, res) => {
  sendSuccess(res, {
    name: 'API Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      scan: '/api/v1/scan',
      chat: '/api/v1/chat',
      user: '/api/v1/user',
    },
    note: 'Auth (nonce, session cookies) is implemented on the Next.js BFF under /api/auth/*; Express routes require dual JWT on /api/v1/*.',
  });
});

router.use('/api/v1', authMiddleware, authRouter);
router.use('/api/v1', authMiddleware, chatRouter);
router.use('/api/v1', authMiddleware, userRouter);

export default router;
