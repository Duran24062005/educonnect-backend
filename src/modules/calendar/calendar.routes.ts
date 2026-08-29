import { Router } from 'express';
import CalendarController from './CalendarController.js';
import ScheduleController from './ScheduleController.js';
import ScheduleEntryController from './ScheduleEntryController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
    calendarCatalogQuerySchema,
    calendarQuerySchema,
    createCalendarExceptionSchema,
    createCalendarSessionSchema,
    updateCalendarSessionSchema,
    calendarSessionParamSchema,
} from './calendar.validators.js';
import {
    createScheduleSchema,
    scheduleIdSchema,
    scheduleQuerySchema,
    teacherScheduleQuerySchema,
    updateScheduleSchema,
} from './schedule.validators.js';
import { scheduleEntryListSchema, scheduleEntryIdSchema, createScheduleEntrySchema, updateScheduleEntrySchema } from './schedule-entry.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.get('/catalog', authorize('admin', 'teacher', 'student', 'parent'), validateRequest(calendarCatalogQuerySchema), CalendarController.getCatalog);
router.get('/', authorize('admin'), validateRequest(calendarQuerySchema), CalendarController.getCalendar);
router.get('/me', authorize('teacher', 'student', 'parent'), validateRequest(calendarQuerySchema), CalendarController.getMyCalendar);
router.get('/sessions/:id', authorize('admin', 'teacher', 'student', 'parent'), validateRequest(calendarSessionParamSchema), CalendarController.getSession);
router.post('/sessions', authorize('admin', 'teacher'), validateRequest(createCalendarSessionSchema), CalendarController.createSession);
router.post('/exceptions', authorize('admin'), validateRequest(createCalendarExceptionSchema), CalendarController.createException);
router.patch(
    '/sessions/:id',
    authorize('admin', 'teacher'),
    validateRequest(updateCalendarSessionSchema),
    CalendarController.updateSession
);

router.get('/schedules', authorize('admin'), validateRequest(scheduleQuerySchema), ScheduleController.list);
router.get('/schedules/me', authorize('teacher'), validateRequest(teacherScheduleQuerySchema), CalendarController.getTeacherSchedules);
router.get('/schedules/:id/entries', authorize('admin'), validateRequest(scheduleEntryListSchema), ScheduleEntryController.list);
router.post('/schedules/:id/entries', authorize('admin'), validateRequest(createScheduleEntrySchema), ScheduleEntryController.create);
router.patch('/schedules/:id/entries/:entryId', authorize('admin'), validateRequest(updateScheduleEntrySchema), ScheduleEntryController.update);
router.delete('/schedules/:id/entries/:entryId', authorize('admin'), validateRequest(scheduleEntryIdSchema), ScheduleEntryController.archive);
router.post('/schedules/drafts', authorize('admin'), validateRequest(createScheduleSchema), ScheduleController.createDraft);
router.patch('/schedules/:id', authorize('admin'), validateRequest(updateScheduleSchema), ScheduleController.update);
router.post('/schedules/:id/publish', authorize('admin'), validateRequest(scheduleIdSchema), ScheduleController.publish);

export default router;
