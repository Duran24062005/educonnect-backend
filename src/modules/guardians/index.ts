import router from './guardians.routes.js';
import service from './GuardianService.js';

export { service as guardianService };
export default {
    name: 'guardians',
    basePath: '/api/guardians',
    router,
};
