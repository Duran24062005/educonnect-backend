import router from './academic.routes.js';
import service from './AcademicService.js';

export { service as academicService };
export default {
    name: 'academic',
    basePath: '/api/academic',
    router,
};
