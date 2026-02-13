import { Router } from 'express';
import {
    register,
    login,
    logout,
    getCurrentUser,
    changePassword,
} from '../../controller/auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const auth_router = Router();

// Rutas públicas
auth_router.post('/register', register);
auth_router.post('/login', login);

// Rutas protegidas
auth_router.get('/me', protect, getCurrentUser);
auth_router.post('/logout', protect, logout);
auth_router.post('/change-password', protect, changePassword);

export default auth_router;