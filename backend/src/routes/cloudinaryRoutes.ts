import { Router } from 'express';
import { generateSignature } from '../controllers/cloudinaryController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Only AUDITOR and ADMIN can upload insurance documents
router.get('/sign', authenticate, requireRole(['AUDITOR', 'ADMIN']), generateSignature);

export { router as cloudinaryRoutes };
