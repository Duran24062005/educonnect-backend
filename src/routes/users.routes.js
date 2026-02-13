import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    getPendingUsers,
    approveUser,
    rejectUser,
    changeUserStatus,
} from '../controller/user.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const users_router = Router();

// Todas las rutas de usuarios requieren autenticación
users_router.use(protect);

// Rutas públicas (autenticadas)
users_router.get('/:id', getUserById);
users_router.put('/:id', updateUser);

// Rutas administrativas
users_router.get('/', authorize('admin'), getAllUsers);
users_router.get('/pending', authorize('admin'), getPendingUsers);
users_router.post('/:id/approve', authorize('admin'), approveUser);
users_router.delete('/:id', authorize('admin'), rejectUser);
users_router.patch('/:id/status', authorize('admin'), changeUserStatus);

export default users_router;