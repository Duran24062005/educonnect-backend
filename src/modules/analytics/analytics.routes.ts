import { Router } from 'express';
import AnalyticsController from './AnalyticsController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import {
    studentOverviewQuerySchema,
    studentAreasQuerySchema,
    studentBulletinQuerySchema,
    studentAreaTrendQuerySchema,
    studentPeriodSummaryQuerySchema,
    teacherGroupsQuerySchema,
    teacherDashboardSummaryQuerySchema,
    teacherGroupPerformanceQuerySchema,
    teacherGroupTrendQuerySchema,
    teacherStudentDetailQuerySchema,
    adminDashboardSummaryQuerySchema,
    adminInstitutionOverviewQuerySchema,
    adminInstitutionTrendQuerySchema,
    adminByGradeQuerySchema,
    adminByAreaQuerySchema,
    adminGradeDetailQuerySchema,
} from './analytics.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.get('/student/me/overview', authorize('student'), validateRequest(studentOverviewQuerySchema), AnalyticsController.studentOverview);
router.get('/student/me/areas', authorize('student'), validateRequest(studentAreasQuerySchema), AnalyticsController.studentAreas);
router.get('/student/me/bulletin', authorize('student'), validateRequest(studentBulletinQuerySchema), AnalyticsController.studentBulletin);
router.get('/student/me/area-trend', authorize('student'), validateRequest(studentAreaTrendQuerySchema), AnalyticsController.studentAreaTrend);
router.get('/student/me/period-summary', authorize('student'), validateRequest(studentPeriodSummaryQuerySchema), AnalyticsController.studentPeriodSummary);

router.get('/teacher/me/groups', authorize('teacher'), validateRequest(teacherGroupsQuerySchema), AnalyticsController.teacherGroups);
router.get('/teacher/me/dashboard-summary', authorize('teacher'), validateRequest(teacherDashboardSummaryQuerySchema), AnalyticsController.teacherDashboardSummary);
router.get('/teacher/me/group-performance', authorize('teacher'), validateRequest(teacherGroupPerformanceQuerySchema), AnalyticsController.teacherGroupPerformance);
router.get('/teacher/me/group-trend', authorize('teacher'), validateRequest(teacherGroupTrendQuerySchema), AnalyticsController.teacherGroupTrend);
router.get('/teacher/me/student-detail', authorize('teacher'), validateRequest(teacherStudentDetailQuerySchema), AnalyticsController.teacherStudentDetail);

router.get('/admin/dashboard-summary', authorize('admin'), validateRequest(adminDashboardSummaryQuerySchema), AnalyticsController.adminDashboardSummary);
router.get('/admin/institution-overview', authorize('admin'), validateRequest(adminInstitutionOverviewQuerySchema), AnalyticsController.adminInstitutionOverview);
router.get('/admin/institution-trend', authorize('admin'), validateRequest(adminInstitutionTrendQuerySchema), AnalyticsController.adminInstitutionTrend);
router.get('/admin/by-grade', authorize('admin'), validateRequest(adminByGradeQuerySchema), AnalyticsController.adminByGrade);
router.get('/admin/by-area', authorize('admin'), validateRequest(adminByAreaQuerySchema), AnalyticsController.adminByArea);
router.get('/admin/grade-detail', authorize('admin'), validateRequest(adminGradeDetailQuerySchema), AnalyticsController.adminGradeDetail);

export default router;
