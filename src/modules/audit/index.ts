import router from './audit-logs.routes.js';
import service from './AuditLogService.js';

export { service as auditLogService };
export default {
    name: 'audit',
    basePath: '/api/audit-logs',
    router,
};
