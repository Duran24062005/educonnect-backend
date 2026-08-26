import { Router } from 'express';
import AttendanceController from './AttendanceController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
    attendanceSessionParamSchema,
    attendanceSessionsQuerySchema,
    attendanceStudentSummarySchema,
    createAttendanceSessionSchema,
    updateAttendanceRecordsSchema,
    updateAttendanceSessionStatusSchema,
} from './attendance.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.post('/sessions', authorize('admin', 'teacher'), validateRequest(createAttendanceSessionSchema), AttendanceController.createSession);
router.get('/sessions', authorize('admin', 'teacher'), validateRequest(attendanceSessionsQuerySchema), AttendanceController.listSessions);
router.get('/reports', authorize('admin'), validateRequest(attendanceSessionsQuerySchema), AttendanceController.getInstitutionalReport);
router.get('/reports.csv', authorize('admin'), validateRequest(attendanceSessionsQuerySchema), AttendanceController.downloadInstitutionalReport);
router.get('/sessions/:id', authorize('admin', 'teacher'), validateRequest(attendanceSessionParamSchema), AttendanceController.getSession);
router.patch('/sessions/:id/records', authorize('admin', 'teacher'), validateRequest(updateAttendanceRecordsSchema), AttendanceController.updateRecords);
router.patch('/sessions/:id/status', authorize('admin', 'teacher'), validateRequest(updateAttendanceSessionStatusSchema), AttendanceController.updateStatus);
router.get('/students/:student_id/summary', authorize('admin', 'teacher', 'student', 'parent'), validateRequest(attendanceStudentSummarySchema), AttendanceController.getStudentSummary);

export default router;
