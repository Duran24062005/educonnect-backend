import router from './evaluations.routes.js';
import service from './EvaluationService.js';

export { service as evaluationService };
export default {
    name: 'evaluations',
    basePath: '/api/evaluations',
    router,
};
