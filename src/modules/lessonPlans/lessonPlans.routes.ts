import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import Controller from './LessonPlanController.js';
import { createLessonPlanSchema, lessonPlanBySessionSchema, updateLessonPlanSchema } from './lessonPlans.validators.js';

const router = Router();
router.use(protect, requireInstitutionContext);
router.get('/session/:sessionId', authorize('admin', 'teacher', 'student', 'parent'), validateRequest(lessonPlanBySessionSchema), Controller.getBySession);
router.post('/', authorize('teacher'), validateRequest(createLessonPlanSchema), Controller.create);
router.patch('/:id', authorize('admin', 'teacher'), validateRequest(updateLessonPlanSchema), Controller.update);

export default router;
