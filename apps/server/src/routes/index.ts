import { Router } from 'express';
import authRouter from './auth';

import { authMiddleware } from '@/middlewares';

const router = Router();

router.use('/api/v1', authMiddleware, authRouter);

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

export default router;
