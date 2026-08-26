import router from './analytics.routes.js';
import service from './AnalyticsService.js';

export { service as analyticsService };
export default {
    name: 'analytics',
    basePath: '/api/analytics',
    router,
};
