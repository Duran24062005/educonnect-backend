import { Router } from 'express';
import PlatformController from './PlatformController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
    listInstitutionsSchema,
    institutionIdSchema,
    createInstitutionSchema,
    updateInstitutionSchema,
    changeInstitutionStatusSchema,
    assignPrimaryAdminSchema,
} from './platform.validators.js';

const router = Router();

router.use(protect, authorize('superadmin'));
router.get('/institutions', validateRequest(listInstitutionsSchema), PlatformController.list);
router.post('/institutions', validateRequest(createInstitutionSchema), PlatformController.create);
router.post('/institutions/:id/primary-admin', validateRequest(assignPrimaryAdminSchema), PlatformController.assignPrimaryAdmin);
router.get('/institutions/:id', validateRequest(institutionIdSchema), PlatformController.getById);
router.patch('/institutions/:id', validateRequest(updateInstitutionSchema), PlatformController.update);
router.patch('/institutions/:id/status', validateRequest(changeInstitutionStatusSchema), PlatformController.changeStatus);
router.post('/institutions/:id/primary-admin/invitation', validateRequest(institutionIdSchema), PlatformController.resendInvitation);

export default router;
