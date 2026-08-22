import { Router } from 'express';
import ActivityController from '../controllers/ActivityController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../middlewares/tenant.middleware.js';
import {
    teacherActivitiesQuerySchema,
    studentActivitiesQuerySchema,
    createActivitySchema,
    activityParamSchema,
    updateActivitySchema,
    reviewActivitySubmissionSchema,
} from '../validators/activities.validators.js';
import { uploadActivitySubmission } from '../middlewares/activity-upload.middleware.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.post('/teacher/me', authorize('teacher'), validateRequest(createActivitySchema), ActivityController.createTeacherActivity);
router.get('/teacher/me', authorize('teacher'), validateRequest(teacherActivitiesQuerySchema), ActivityController.getTeacherActivities);
router.get('/teacher/me/:activity_id', authorize('teacher'), validateRequest(activityParamSchema), ActivityController.getTeacherActivity);
router.put('/teacher/me/:activity_id', authorize('teacher'), validateRequest(updateActivitySchema), ActivityController.updateTeacherActivity);
router.get(
    '/teacher/me/:activity_id/submissions',
    authorize('teacher'),
    validateRequest(activityParamSchema),
    ActivityController.getTeacherActivitySubmissions
);
router.post(
    '/teacher/me/:activity_id/submissions/:student_id/review',
    authorize('teacher'),
    validateRequest(reviewActivitySubmissionSchema),
    ActivityController.reviewTeacherActivitySubmission
);

router.get('/student/me', authorize('student'), validateRequest(studentActivitiesQuerySchema), ActivityController.getStudentActivities);
router.get('/student/me/:activity_id', authorize('student'), validateRequest(activityParamSchema), ActivityController.getStudentActivity);
router.post(
    '/student/me/:activity_id/submission',
    authorize('student'),
    validateRequest(activityParamSchema),
    uploadActivitySubmission,
    ActivityController.submitStudentActivity
);

export default router;
