import { Router } from 'express';
import { getFields, createField, updateField, deleteField } from '../controllers/fieldController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Everyone can view fields (for rule builder and parcel form)
router.get('/', authenticate, getFields);

// Only ADMIN can manage fields
router.post('/', authenticate, requireRole(['ADMIN']), createField);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateField);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteField);

export { router as fieldRoutes };
