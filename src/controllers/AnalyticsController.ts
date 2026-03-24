// @ts-nocheck
import asyncHandler from '../utils/asyncHandler.js';
import AnalyticsService from '../services/AnalyticsService.js';
import { getQueryString } from '../utils/request.js';

class AnalyticsController {
    studentOverview = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentOverview(req.userId, getQueryString(req.query.school_year_id));
        res.status(200).json({ status: 'success', data });
    });

    studentAreas = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentAreas(req.userId, getQueryString(req.query.school_year_id));
        res.status(200).json({ status: 'success', data });
    });

    studentBulletin = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentBulletin(
            req.userId,
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.period_id)
        );
        res.status(200).json({ status: 'success', data });
    });

    studentAreaTrend = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentAreaTrend(
            req.userId,
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.area_id)
        );
        res.status(200).json({ status: 'success', data });
    });

    studentPeriodSummary = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getStudentPeriodSummary(req.userId, getQueryString(req.query.school_year_id));
        res.status(200).json({ status: 'success', data });
    });

    teacherGroups = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherGroups(req.userId, getQueryString(req.query.school_year_id));
        res.status(200).json({ status: 'success', data });
    });

    teacherGroupPerformance = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherGroupPerformance(
            req.userId,
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.group_id),
            getQueryString(req.query.area_id),
            getQueryString(req.query.period_id) ?? undefined
        );
        res.status(200).json({ status: 'success', data });
    });

    teacherGroupTrend = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherGroupTrend(
            req.userId,
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.group_id),
            getQueryString(req.query.area_id) ?? undefined
        );
        res.status(200).json({ status: 'success', data });
    });

    teacherStudentDetail = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherStudentDetail(
            req.userId,
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.student_id),
            getQueryString(req.query.area_id)
        );
        res.status(200).json({ status: 'success', data });
    });

    teacherDashboardSummary = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getTeacherDashboardSummary(req.userId, getQueryString(req.query.school_year_id));
        res.status(200).json({ status: 'success', data });
    });

    adminInstitutionOverview = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminInstitutionOverview(
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.period_id) ?? undefined
        );
        res.status(200).json({ status: 'success', data });
    });

    adminDashboardSummary = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminDashboardSummary(getQueryString(req.query.school_year_id));
        res.status(200).json({ status: 'success', data });
    });

    adminInstitutionTrend = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminInstitutionTrend(getQueryString(req.query.school_year_id));
        res.status(200).json({ status: 'success', data });
    });

    adminByGrade = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminByGrade(
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.period_id) ?? undefined
        );
        res.status(200).json({ status: 'success', data });
    });

    adminByArea = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminByArea(
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.grade_id),
            getQueryString(req.query.period_id) ?? undefined
        );
        res.status(200).json({ status: 'success', data });
    });

    adminGradeDetail = asyncHandler(async (req, res) => {
        const data = await AnalyticsService.getAdminGradeDetail(
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.grade_id),
            getQueryString(req.query.period_id)
        );
        res.status(200).json({ status: 'success', data });
    });
}

export default new AnalyticsController();
