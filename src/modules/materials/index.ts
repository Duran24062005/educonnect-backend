import router from './materials.routes.js';
import service from './MaterialService.js';

export { service as materialService };
export default { name: 'materials', basePath: '/api/materials', router };
