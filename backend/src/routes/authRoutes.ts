import { Router } from 'express';
import { login, createUser, getUsers } from '../controllers/authController';
import { authenticate, requireRole } from '../middleware/auth';
const router = Router();

console.log("🔥 AUTH ROUTER IS MOUNTED!"); // <-- Add this line

router.post('/login', login);

// Admin user management
router.post('/users', authenticate, requireRole(['ADMIN']), createUser);
router.get('/users', authenticate, requireRole(['ADMIN']), getUsers);

export { router as authRoutes };
