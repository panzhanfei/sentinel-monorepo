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
      auth: '/api/v1/auth',
      docs: '/api/v1/docs',
    },
  });
});

router.use('/api/v1', authMiddleware, authRouter);
router.use('/api/v1', authMiddleware, chatRouter);
router.use('/api/v1', authMiddleware, userRouter);

export default router;
