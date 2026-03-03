import { Router } from 'express';
import AuthController from '../../controllers/AuthController.js';
import { protect, protectIncomplete } from '../../middlewares/auth.middleware.js';

const router = Router();

// ── Rutas públicas ──────────────────────────────────────────
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// ── Requiere token, pero el perfil puede estar incompleto ───
// protectIncomplete: verifica JWT pero NO exige person_id
router.post('/complete-profile', protectIncomplete, AuthController.completeProfile);
router.get('/profile-status', protectIncomplete, AuthController.getProfileStatus);

// ── Requiere token y perfil completo ───────────────────────
router.get('/me', protect, AuthController.getCurrentUser);
router.post('/logout', protect, AuthController.logout);
router.post('/change-password', protect, AuthController.changePassword);

export default router;
