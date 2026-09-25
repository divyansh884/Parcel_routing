import { Router } from 'express';
import { uploadBatch, getBatchStatus } from '../controllers/batchController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireRole(['OPERATOR', 'ADMIN']), uploadBatch);
router.get('/:batchId', authenticate, requireRole(['OPERATOR', 'ADMIN', 'AUDITOR']), getBatchStatus);

export { router as batchRoutes };
