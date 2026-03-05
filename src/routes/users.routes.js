import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { uploadProfilePhoto } from '../middlewares/upload.middleware.js';

const router = Router();

// Todas las rutas de usuarios requieren autenticación
router.use(protect);

// Rutas administrativas
router.get('/', authorize('admin'), UserController.getAllUsers);
router.get('/role/:role', authorize('admin'), UserController.getUsersByRole);
router.get('/admin/pending', authorize('admin'), UserController.getPendingUsers);
router.get('/admin/stats', authorize('admin'), UserController.getStatistics);
router.post('/:id/approve', authorize('admin'), UserController.approveUser);
router.delete('/:id', authorize('admin'), UserController.rejectUser);
router.patch('/:id/status', authorize('admin'), UserController.changeUserStatus);

// Rutas públicas (autenticadas)
router.patch('/:id/profile-photo', uploadProfilePhoto, UserController.uploadProfilePhoto);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);

export default router;
