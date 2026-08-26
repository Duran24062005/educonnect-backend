import { asyncHandler, AppError } from '../../utils/error.js';
import AuditLogService from './AuditLogService.js';

class AuditLogController {
    list = asyncHandler(async (req, res) => {
        if (!req.institutionId) {
            throw new AppError('El administrador debe pertenecer a una institución', 409);
        }

        const result = await AuditLogService.list({
            institutionId: req.institutionId,
            action: req.query.action ? String(req.query.action) : undefined,
            entityType: req.query.entity_type ? String(req.query.entity_type) : undefined,
            entityId: req.query.entity_id ? String(req.query.entity_id) : undefined,
            actorUserId: req.query.actor_user_id ? String(req.query.actor_user_id) : undefined,
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 50,
        });

        res.status(200).json({ status: 'success', data: result });
    });
}

export default new AuditLogController();
