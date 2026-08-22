import { Router } from 'express';
import AuditLogController from '../controllers/AuditLogController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { auditLogQuerySchema } from '../validators/audit-logs.validators.js';

const router = Router();

router.use(protect);
router.get('/', authorize('admin'), validateRequest(auditLogQuerySchema), AuditLogController.list);

export default router;
