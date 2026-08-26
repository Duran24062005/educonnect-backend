import router from './students.routes.js';
import service from './StudentService.js';

export { service as studentService };
export default {
    name: 'students',
    basePath: '/api/students',
    router,
};
