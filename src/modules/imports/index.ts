import router from './import.routes.js';
import service from './ImportService.js';

export { service as importService };
export default {
    name: 'imports',
    basePath: '/api/imports',
    router,
};
