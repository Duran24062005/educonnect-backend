import { Router } from 'express';
import AuthController from '../../controllers/AuthController.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rutas protegidas
router.get('/me', protect, AuthController.getCurrentUser);
router.post('/logout', protect, AuthController.logout);
router.post('/change-password', protect, AuthController.changePassword);

export default router;