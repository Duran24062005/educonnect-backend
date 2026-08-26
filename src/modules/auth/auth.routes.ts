import { Router } from 'express';
import AuthController from './AuthController.js';
import { protect, protectIncomplete } from '../../middlewares/auth.middleware.js';
import {
    loginLimiter,
    passwordResetRequestLimiter,
    passwordResetVerifyLimiter,
    registerLimiter,
} from '../../middlewares/rateLimit.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
    registerSchema,
    loginSchema,
    completeProfileSchema,
    changePasswordSchema,
    requestPasswordResetSchema,
    verifyPasswordResetCodeSchema,
    resetPasswordSchema,
} from './auth.validators.js';

const router = Router();

router.post('/register', registerLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validateRequest(loginSchema), AuthController.login);
router.post(
    '/request-password-reset',
    passwordResetRequestLimiter,
    validateRequest(requestPasswordResetSchema),
    AuthController.requestPasswordReset
);
router.post(
    '/verify-password-reset-code',
    passwordResetVerifyLimiter,
    validateRequest(verifyPasswordResetCodeSchema),
    AuthController.verifyPasswordResetCode
);
router.post(
    '/reset-password',
    passwordResetVerifyLimiter,
    validateRequest(resetPasswordSchema),
    AuthController.resetPassword
);

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
