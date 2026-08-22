// @ts-nocheck
import { asyncHandler } from '../utils/error.js';
import EvaluationService from '../services/EvaluationService.js';
import { getQueryString } from '../utils/request.js';

class EvaluationController {
    // ---- GRADE ITEMS ----
    createGradeItem = asyncHandler(async (req, res) => {
        const result = await EvaluationService.createGradeItem(req.userId, req.userRole, req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getGradeItems = asyncHandler(async (req, res) => {
        const period_id = getQueryString(req.query.period_id);
        const area_id = getQueryString(req.query.area_id);
        const result = await EvaluationService.getGradeItemsByPeriodAndArea(period_id, area_id);
        res.status(200).json({ status: 'success', data: result });
    });

    updateGradeItem = asyncHandler(async (req, res) => {
        const result = await EvaluationService.updateGradeItem(req.params.id, req.userId, req.userRole, req.body);
        res.status(200).json({ status: 'success', data: result });
    });

    deleteGradeItem = asyncHandler(async (req, res) => {
        const result = await EvaluationService.deleteGradeItem(req.params.id, req.userId, req.userRole);
        res.status(200).json({ status: 'success', message: result.message });
    });

    // ---- SCORES ----
    registerScore = asyncHandler(async (req, res) => {
        const { student_id, grade_item_id, score } = req.body;
        const result = await EvaluationService.registerScore(
            req.userId,
            req.userRole,
            student_id,
            grade_item_id,
            score,
            {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            }
        );
        res.status(200).json({ status: 'success', message: 'Calificación registrada', data: result });
    });

    getScoresByStudent = asyncHandler(async (req, res) => {
        const result = await EvaluationService.getScoresByStudent(req.params.student_id, req.userId, req.userRole);
        res.status(200).json({ status: 'success', data: result });
    });

    getScoresByGradeItem = asyncHandler(async (req, res) => {
        const result = await EvaluationService.getScoresByGradeItem(req.params.grade_item_id, req.userId, req.userRole);
        res.status(200).json({ status: 'success', data: result });
    });

    // ---- PERIOD RESULTS ----
    calculatePeriodResult = asyncHandler(async (req, res) => {
        const { student_id, area_id, period_id } = req.body;
        const result = await EvaluationService.calculateAndSavePeriodResult(
            req.userId,
            req.userRole,
            student_id,
            area_id,
            period_id
        );
        res.status(200).json({ status: 'success', message: 'Resultado de periodo calculado', data: result });
    });

    getPeriodResultsByStudent = asyncHandler(async (req, res) => {
        const result = await EvaluationService.getPeriodResultsByStudent(
            req.params.student_id,
            req.userId,
            req.userRole
        );
        res.status(200).json({ status: 'success', data: result });
    });

    // ---- FINAL RESULTS ----
    calculateFinalResult = asyncHandler(async (req, res) => {
        const { student_id, school_year_id } = req.body;
        const result = await EvaluationService.calculateAndSaveFinalResult(student_id, school_year_id);
        res.status(200).json({ status: 'success', message: 'Resultado final calculado', data: result });
    });

    getFinalResultsByYear = asyncHandler(async (req, res) => {
        const status = getQueryString(req.query.status);
        const result = await EvaluationService.getFinalResultsByYear(req.params.school_year_id, status ?? undefined);
        res.status(200).json({ status: 'success', data: result });
    });

    getStudentFinalResult = asyncHandler(async (req, res) => {
        const { student_id, school_year_id } = req.params;
        const result = await EvaluationService.getStudentFinalResult(
            student_id,
            school_year_id,
            req.userId,
            req.userRole
        );
        res.status(200).json({ status: 'success', data: result });
    });

    getYearStats = asyncHandler(async (req, res) => {
        const result = await EvaluationService.getYearStats(req.params.school_year_id);
        res.status(200).json({ status: 'success', data: result });
    });
}

export default new EvaluationController();
