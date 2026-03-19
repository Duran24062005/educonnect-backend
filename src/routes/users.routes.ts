import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { uploadProfilePhoto } from '../middlewares/upload.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    listUsersSchema,
    usersByRoleSchema,
    userIdParamSchema,
    updateUserSchema,
    uploadProfilePhotoSchema,
    approveUserSchema,
    changeUserStatusSchema,
} from '../validators/users.validators.js';

const router = Router();

router.use(protect);

router.get('/', authorize('admin'), validateRequest(listUsersSchema), UserController.getAllUsers);
router.get('/role/:role', authorize('admin'), validateRequest(usersByRoleSchema), UserController.getUsersByRole);
router.get('/admin/pending', authorize('admin'), UserController.getPendingUsers);
router.get('/admin/stats', authorize('admin'), UserController.getStatistics);
router.post('/:id/approve', authorize('admin'), validateRequest(approveUserSchema), UserController.approveUser);
router.delete('/:id', authorize('admin'), validateRequest(userIdParamSchema), UserController.rejectUser);
router.patch('/:id/status', authorize('admin'), validateRequest(changeUserStatusSchema), UserController.changeUserStatus);

router.patch(
    '/:id/profile-photo',
    validateRequest(uploadProfilePhotoSchema),
    uploadProfilePhoto,
    UserController.uploadProfilePhoto
);
router.get('/:id', validateRequest(userIdParamSchema), UserController.getUserById);
router.put('/:id', validateRequest(updateUserSchema), UserController.updateUser);

export default router;
