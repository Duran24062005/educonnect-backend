import router from './institutions.routes.js';
import service from './InstitutionService.js';

export { service as institutionService };
export default {
    name: 'institutions',
    basePath: '/api/institutions',
    router,
};
