import { Router } from 'express';
import { login, createUser, getUsers, updateUser, deleteUser } from '../controllers/authController';
import { authenticate, requireRole } from '../middleware/auth';
const router = Router();

router.post('/login', login);

// Admin user management
router.post('/users', authenticate, requireRole(['ADMIN']), createUser);
router.get('/users', authenticate, requireRole(['ADMIN']), getUsers);
router.put('/users/:id', authenticate, requireRole(['ADMIN']), updateUser);
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), deleteUser);

export { router as authRoutes };
