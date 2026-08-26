import { Router } from 'express';
import CalendarController from './CalendarController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
    calendarCatalogQuerySchema,
    calendarQuerySchema,
    calendarSessionParamSchema,
    createCalendarSessionSchema,
    updateCalendarSessionSchema,
} from './calendar.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.get('/catalog', authorize('admin', 'teacher', 'student', 'parent'), validateRequest(calendarCatalogQuerySchema), CalendarController.getCatalog);
router.get('/', authorize('admin'), validateRequest(calendarQuerySchema), CalendarController.getCalendar);
router.get('/me', authorize('teacher', 'student', 'parent'), validateRequest(calendarQuerySchema), CalendarController.getMyCalendar);
router.post('/sessions', authorize('admin', 'teacher'), validateRequest(createCalendarSessionSchema), CalendarController.createSession);
router.patch(
    '/sessions/:id',
    authorize('admin', 'teacher'),
    validateRequest(updateCalendarSessionSchema),
    CalendarController.updateSession
);

export default router;
