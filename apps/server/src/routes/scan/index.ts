import { Router } from 'express';
import * as AuditController from '@/controllers';
import { asyncHandler } from '@/middlewares';

const router = Router();

router.post('/scan', asyncHandler(AuditController.startScan));
router.post('/scan/revoked', asyncHandler(AuditController.markRevokedAllowance));
router.get('/scan/latest', asyncHandler(AuditController.getLatestJob));
router.get('/scan/stream', asyncHandler(AuditController.handleAuditStream));
router.get('/scan/:jobId', asyncHandler(AuditController.getJobStatus));

export default router;
