import { Router } from 'express';
import InstitutionController from './InstitutionController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { createInstitutionSchema, assignInstitutionUserSchema, campusCreateSchema, campusUpdateSchema, campusIdSchema, shiftCreateSchema, shiftUpdateSchema, shiftIdSchema, scheduleConfigSchema } from './institutions.validators.js';

const router = Router();

router.use(protect);
router.post('/', authorize('admin'), validateRequest(createInstitutionSchema), InstitutionController.create);
router.get('/current', requireInstitutionContext, InstitutionController.getCurrent);
router.get('/current/schedule-config', requireInstitutionContext, InstitutionController.getScheduleConfig);
router.patch(
    '/current/users/:user_id',
    authorize('admin'),
    requireInstitutionContext,
    validateRequest(assignInstitutionUserSchema),
    InstitutionController.assignUser
);
router.get('/current/campuses', requireInstitutionContext, InstitutionController.listCampuses);
router.post('/current/campuses', authorize('admin'), requireInstitutionContext, validateRequest(campusCreateSchema), InstitutionController.createCampus);
router.patch('/current/campuses/:id', authorize('admin'), requireInstitutionContext, validateRequest(campusUpdateSchema), InstitutionController.updateCampus);
router.delete('/current/campuses/:id', authorize('admin'), requireInstitutionContext, validateRequest(campusIdSchema), InstitutionController.deleteCampus);
router.get('/current/shifts', requireInstitutionContext, InstitutionController.listShifts);
router.post('/current/shifts', authorize('admin'), requireInstitutionContext, validateRequest(shiftCreateSchema), InstitutionController.createShift);
router.patch('/current/shifts/:id', authorize('admin'), requireInstitutionContext, validateRequest(shiftUpdateSchema), InstitutionController.updateShift);
router.delete('/current/shifts/:id', authorize('admin'), requireInstitutionContext, validateRequest(shiftIdSchema), InstitutionController.deleteShift);
router.patch('/current/schedule-config', authorize('admin'), requireInstitutionContext, validateRequest(scheduleConfigSchema), InstitutionController.updateScheduleConfig);

export default router;
