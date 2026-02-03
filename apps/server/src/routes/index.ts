import { Router } from 'express';
import authRouter from './auth';

const router = Router();

router.use(authRouter);
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'API Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      docs: '/api/docs', // 可选：API文档
    },
  });
});

export default router;
