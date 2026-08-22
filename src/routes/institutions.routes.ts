import { Router } from 'express';
import InstitutionController from '../controllers/InstitutionController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../middlewares/tenant.middleware.js';
import { createInstitutionSchema, assignInstitutionUserSchema } from '../validators/institutions.validators.js';

const router = Router();

router.use(protect);
router.post('/', authorize('admin'), validateRequest(createInstitutionSchema), InstitutionController.create);
router.get('/current', requireInstitutionContext, InstitutionController.getCurrent);
router.patch(
    '/current/users/:user_id',
    authorize('admin'),
    requireInstitutionContext,
    validateRequest(assignInstitutionUserSchema),
    InstitutionController.assignUser
);

export default router;
