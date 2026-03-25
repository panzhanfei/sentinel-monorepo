import { Router } from 'express';
import authRouter from './scan';
import chatRouter from './chat';
import userRouter from './user';

import { authMiddleware } from '@/middlewares';
import { refreshTokens } from '@/controllers/auth/refresh.controller';

const router = Router();

router.post('/api/v1/auth/refresh', refreshTokens);

router.get('/api/v1', (req, res) => {
  res.status(200).json({
    name: 'API Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      docs: '/api/v1/docs', // 可选：API文档
    },
  });
});

router.use('/api/v1', authMiddleware, authRouter);
router.use('/api/v1', authMiddleware, chatRouter);
router.use('/api/v1', authMiddleware, userRouter);

export default router;
