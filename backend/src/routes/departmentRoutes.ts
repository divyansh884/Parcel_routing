import { Router } from 'express';
import { getDepartments, addDepartment, deleteDepartment } from '../controllers/departmentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// ANY logged in user can view departments (so dropdowns populate)
router.get('/', authenticate, getDepartments);

// Only ADMIN can add/remove departments
router.post('/', authenticate, requireRole(['ADMIN']), addDepartment);
router.delete('/:name', authenticate, requireRole(['ADMIN']), deleteDepartment);

export { router as departmentRoutes };
