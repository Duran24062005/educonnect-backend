import router from './notifications.routes.js';
import service from './NotificationService.js';

export { service as notificationService };
export default {
    name: 'notifications',
    basePath: '/api/notifications',
    router,
};
