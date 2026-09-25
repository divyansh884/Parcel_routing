import { Router } from 'express';
import { routeParcel, getPendingApprovals, approveDecision, getAllParcels, updateParcel, deleteParcel, updateInsurance } from '../controllers/parcelController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Only OPERATOR and ADMIN can route parcels
router.post('/route', authenticate, requireRole(['OPERATOR', 'ADMIN']), routeParcel);

// AUDITOR routes
router.get('/pending', authenticate, requireRole(['AUDITOR', 'ADMIN']), getPendingApprovals);
router.put('/decision/:id/approve', authenticate, requireRole(['AUDITOR', 'ADMIN']), approveDecision);

// ALL roles can view parcels
router.get('/', authenticate, requireRole(['OPERATOR', 'ADMIN', 'AUDITOR']), getAllParcels);

// AUDITOR and ADMIN can update insurance
router.put('/:id/insurance', authenticate, requireRole(['AUDITOR', 'ADMIN']), updateInsurance);

// ADMIN only can update or delete existing packages
router.put('/:id', authenticate, requireRole(['ADMIN']), updateParcel);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteParcel);

export { router as parcelRoutes };
