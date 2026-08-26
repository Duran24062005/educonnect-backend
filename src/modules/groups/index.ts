import router from './groups.routes.js';
import service from './GroupService.js';

export { service as groupService };
export default {
    name: 'groups',
    basePath: '/api/groups',
    router,
};
