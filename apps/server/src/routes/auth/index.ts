import { Router } from 'express';
import * as AuditController from '@/controllers';

const router = Router();

// 发起扫描任务 (POST)
router.post('/scan', AuditController.startScan);

//  获取最近一次成功扫描 (GET)
router.get('/scan/latest', AuditController.getLatestJob);

//  SSE 流式日志 (GET)
router.get('/scan/stream', AuditController.handleAuditStream);
//  获取任务进度/详情 (GET)
router.get('/scan/:jobId', AuditController.getJobStatus);
export default router;
