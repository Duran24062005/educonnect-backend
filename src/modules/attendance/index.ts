import router from './attendance.routes.js';
import service from './AttendanceService.js';

export { service as attendanceService };
export default {
    name: 'attendance',
    basePath: '/api/attendance',
    router,
};
