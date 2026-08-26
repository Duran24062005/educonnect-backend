import router from './calendar.routes.js';
import service from './CalendarService.js';

export { service as calendarService };
export default {
    name: 'calendar',
    basePath: '/api/calendar',
    router,
};
