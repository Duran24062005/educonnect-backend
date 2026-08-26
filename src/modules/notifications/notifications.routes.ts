import { Router } from 'express';
import NotificationController from './NotificationController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import {
    notificationsQuerySchema,
    notificationIdParamSchema,
    createAdminAnnouncementSchema,
    createTeacherAnnouncementSchema,
} from './notifications.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.get('/me', validateRequest(notificationsQuerySchema), NotificationController.getMyNotifications);
router.get('/me/unread-count', NotificationController.getMyUnreadCount);
router.patch('/me/read-all', NotificationController.markAllNotificationsAsRead);
router.patch('/:id/read', validateRequest(notificationIdParamSchema), NotificationController.markNotificationAsRead);

router.post(
    '/admin/announcements',
    authorize('admin'),
    validateRequest(createAdminAnnouncementSchema),
    NotificationController.createAdminAnnouncement
);
router.post(
    '/teacher/announcements',
    authorize('teacher'),
    validateRequest(createTeacherAnnouncementSchema),
    NotificationController.createTeacherAnnouncement
);

export default router;
