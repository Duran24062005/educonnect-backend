import asyncHandler from '../utils/asyncHandler.js';
import AnalyticsService from '../services/AnalyticsService.js';

class AnalyticsController {
    studentOverview = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentOverview(req.userId, req.query.school_year_id);
        res.status(200).json({ status: 'success', data });
    });

    studentAreas = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentAreas(req.userId, req.query.school_year_id);
        res.status(200).json({ status: 'success', data });
    });

    studentAreaTrend = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentAreaTrend(
            req.userId,
            req.query.school_year_id,
            req.query.area_id
        );
        res.status(200).json({ status: 'success', data });
    });

    studentPeriodSummary = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentPeriodSummary(req.userId, req.query.school_year_id);
        res.status(200).json({ status: 'success', data });
    });

    teacherGroups = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherGroups(req.userId, req.query.school_year_id);
        res.status(200).json({ status: 'success', data });
    });

    teacherGroupPerformance = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherGroupPerformance(
            req.userId,
            req.query.school_year_id,
            req.query.group_id,
            req.query.area_id,
            req.query.period_id
        );
        res.status(200).json({ status: 'success', data });
    });

    teacherGroupTrend = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherGroupTrend(
            req.userId,
            req.query.school_year_id,
            req.query.group_id,
            req.query.area_id
        );
        res.status(200).json({ status: 'success', data });
    });

    teacherStudentDetail = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherStudentDetail(
            req.userId,
            req.query.school_year_id,
            req.query.student_id,
            req.query.area_id
        );
        res.status(200).json({ status: 'success', data });
    });

    teacherDashboardSummary = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherDashboardSummary(req.userId, req.query.school_year_id);
        res.status(200).json({ status: 'success', data });
    });

    adminInstitutionOverview = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminInstitutionOverview(
            req.query.school_year_id,
            req.query.period_id
        );
        res.status(200).json({ status: 'success', data });
    });

    adminDashboardSummary = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminDashboardSummary(req.query.school_year_id);
        res.status(200).json({ status: 'success', data });
    });

    adminInstitutionTrend = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminInstitutionTrend(req.query.school_year_id);
        res.status(200).json({ status: 'success', data });
    });

    adminByGrade = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminByGrade(req.query.school_year_id, req.query.period_id);
        res.status(200).json({ status: 'success', data });
    });

    adminByArea = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminByArea(
            req.query.school_year_id,
            req.query.grade_id,
            req.query.period_id
        );
        res.status(200).json({ status: 'success', data });
    });

    adminGradeDetail = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminGradeDetail(
            req.query.school_year_id,
            req.query.grade_id,
            req.query.period_id
        );
        res.status(200).json({ status: 'success', data });
    });
}

export default new AnalyticsController();
