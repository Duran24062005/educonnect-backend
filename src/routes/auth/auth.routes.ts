import { Router } from 'express';
import AuthController from '../../controllers/AuthController.js';
import { protect, protectIncomplete } from '../../middlewares/auth.middleware.js';
import { loginLimiter, registerLimiter } from '../../middlewares/rateLimit.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
    registerSchema,
    loginSchema,
    completeProfileSchema,
    changePasswordSchema,
} from '../../validators/auth.validators.js';

const router = Router();

router.post('/register', registerLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validateRequest(loginSchema), AuthController.login);

router.post(
    '/complete-profile',
    protectIncomplete,
    validateRequest(completeProfileSchema),
    AuthController.completeProfile
);
router.get('/profile-status', protectIncomplete, AuthController.getProfileStatus);

router.get('/me', protect, AuthController.getCurrentUser);
router.post('/logout', protect, AuthController.logout);
router.post('/change-password', protect, validateRequest(changePasswordSchema), AuthController.changePassword);

export default router;
