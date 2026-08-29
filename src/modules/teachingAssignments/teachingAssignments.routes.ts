import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import Controller from './TeachingAssignmentController.js';
import { teachingAssignmentQuerySchema, createTeachingAssignmentSchema, updateTeachingAssignmentSchema, teachingAssignmentIdSchema } from './teachingAssignments.validators.js';

const router = Router();
router.use(protect, requireInstitutionContext);
router.get('/', authorize('admin', 'teacher'), validateRequest(teachingAssignmentQuerySchema), Controller.list);
router.get('/:id', authorize('admin', 'teacher'), validateRequest(teachingAssignmentIdSchema), Controller.get);
router.post('/', authorize('admin'), validateRequest(createTeachingAssignmentSchema), Controller.create);
router.patch('/:id', authorize('admin'), validateRequest(updateTeachingAssignmentSchema), Controller.update);

export default router;
