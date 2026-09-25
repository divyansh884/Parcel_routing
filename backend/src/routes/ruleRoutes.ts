import { Router } from 'express';
import { getActiveRules, createDraft, publishRules, publishDirect } from '../controllers/ruleController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone can view active rules (or just Operators, but we'll leave it open for now)
router.get('/active', getActiveRules);

// Only ADMIN can create drafts and publish
router.post('/draft', authenticate, requireRole(['ADMIN']), createDraft);
router.post('/:version/publish', authenticate, requireRole(['ADMIN']), publishRules);
router.post('/publish', authenticate, requireRole(['ADMIN']), publishDirect);

export { router as ruleRoutes };
