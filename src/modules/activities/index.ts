import router from './activities.routes.js';
import service from './ActivityService.js';

export { service as activityService };
export default {
    name: 'activities',
    basePath: '/api/activities',
    router,
};
