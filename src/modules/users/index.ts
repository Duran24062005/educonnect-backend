import router from './users.routes.js';
import service from './UserService.js';

export { service as userService };
export default {
    name: 'users',
    basePath: '/api/users',
    router,
};
