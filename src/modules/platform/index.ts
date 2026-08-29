import router from './platform.routes.js';
import service from './PlatformService.js';

export { service as platformService };
export default {
    name: 'platform',
    basePath: '/api/platform',
    router,
};
