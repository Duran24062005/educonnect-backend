import { asyncHandler } from '../utils/error.js';
import NotificationService from '../services/NotificationService.js';

class NotificationController {
    getMyNotifications = asyncHandler(async (req, res) => {
        const result = await NotificationService.getMyNotifications(req.userId, req.query);
        res.status(200).json({ status: 'success', data: result });
    });

    getMyUnreadCount = asyncHandler(async (req, res) => {
        const result = await NotificationService.getMyUnreadCount(req.userId);
        res.status(200).json({ status: 'success', data: result });
    });

    markNotificationAsRead = asyncHandler(async (req, res) => {
        const result = await NotificationService.markNotificationAsRead(req.userId, req.params.id);
        res.status(200).json({ status: 'success', data: result });
    });

    markAllNotificationsAsRead = asyncHandler(async (req, res) => {
        const result = await NotificationService.markAllNotificationsAsRead(req.userId);
        res.status(200).json({ status: 'success', data: result });
    });

    createAdminAnnouncement = asyncHandler(async (req, res) => {
        const result = await NotificationService.createAdminAnnouncement(req.userId, req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    createTeacherAnnouncement = asyncHandler(async (req, res) => {
        const result = await NotificationService.createTeacherAnnouncement(req.userId, req.body);
        res.status(201).json({ status: 'success', data: result });
    });
}

export default new NotificationController();
