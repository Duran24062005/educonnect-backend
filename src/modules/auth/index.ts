import router from './auth.routes.js';
import authService from './AuthService.js';
import sessionService from './SessionService.js';

export { authService, sessionService };
export default {
    name: 'auth',
    basePath: '/api/auth',
    router,
};
