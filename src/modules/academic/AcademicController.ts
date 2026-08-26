import { asyncHandler } from '../../utils/error.js';
import AcademicService from './AcademicService.js';

class AcademicController {
    // ---- SCHOOL YEARS ----
    createSchoolYear = asyncHandler(async (req, res) => {
        const result = await AcademicService.createSchoolYear(req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getAllSchoolYears = asyncHandler(async (req, res) => {
        const result = await AcademicService.getAllSchoolYears();
        res.status(200).json({ status: 'success', data: result, schoolYears: result });
    });

    getActiveSchoolYear = asyncHandler(async (req, res) => {
        const result = await AcademicService.getActiveSchoolYear();
        res.status(200).json({ status: 'success', data: result, schoolYear: result });
    });

    setActiveSchoolYear = asyncHandler(async (req, res) => {
        const result = await AcademicService.setActiveSchoolYear(req.params.id);
        res.status(200).json({ status: 'success', message: 'Año escolar activado', data: result });
    });

    deleteSchoolYear = asyncHandler(async (req, res) => {
        const result = await AcademicService.deleteSchoolYear(req.params.id);
        res.status(200).json({ status: 'success', message: result.message });
    });

    promoteStudents = asyncHandler(async (req, res) => {
        const result = await AcademicService.promoteStudents(req.body);
        res.status(200).json({
            status: 'success',
            message: 'Promoción masiva ejecutada',
            data: result,
        });
    });

    // ---- PERIODS ----
    createPeriod = asyncHandler(async (req, res) => {
        const result = await AcademicService.createPeriod(req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getPeriodsBySchoolYear = asyncHandler(async (req, res) => {
        const result = await AcademicService.getPeriodsBySchoolYear(req.params.school_year_id);
        res.status(200).json({ status: 'success', data: result, periods: result });
    });

    deletePeriod = asyncHandler(async (req, res) => {
        const result = await AcademicService.deletePeriod(req.params.id);
        res.status(200).json({ status: 'success', message: result.message });
    });

    updatePeriodStatus = asyncHandler(async (req, res) => {
        const result = await AcademicService.updatePeriodStatus(req.params.id, req.body.status, {
            actorUserId: req.userId,
            actorRole: req.userRole,
            institutionId: req.institutionId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.status(200).json({ status: 'success', data: result });
    });

    // ---- GRADES ----
    createGrade = asyncHandler(async (req, res) => {
        const result = await AcademicService.createGrade(req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getAllGrades = asyncHandler(async (req, res) => {
        const result = await AcademicService.getAllGrades();
        res.status(200).json({ status: 'success', data: result, grades: result });
    });

    updateGrade = asyncHandler(async (req, res) => {
        const result = await AcademicService.updateGrade(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: result });
    });

    deleteGrade = asyncHandler(async (req, res) => {
        const result = await AcademicService.deleteGrade(req.params.id);
        res.status(200).json({ status: 'success', message: result.message });
    });

    // ---- AREAS ----
    createArea = asyncHandler(async (req, res) => {
        const result = await AcademicService.createArea(req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getAllAreas = asyncHandler(async (req, res) => {
        const result = await AcademicService.getAllAreas();
        res.status(200).json({ status: 'success', data: result, areas: result });
    });

    updateArea = asyncHandler(async (req, res) => {
        const result = await AcademicService.updateArea(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: result });
    });

    deleteArea = asyncHandler(async (req, res) => {
        const result = await AcademicService.deleteArea(req.params.id);
        res.status(200).json({ status: 'success', message: result.message });
    });

    // ---- AULAS ----
    createAula = asyncHandler(async (req, res) => {
        const result = await AcademicService.createAula(req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getAllAulas = asyncHandler(async (req, res) => {
        const result = await AcademicService.getAllAulas();
        res.status(200).json({ status: 'success', data: result, aulas: result });
    });

    updateAula = asyncHandler(async (req, res) => {
        const result = await AcademicService.updateAula(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: result });
    });

    deleteAula = asyncHandler(async (req, res) => {
        const result = await AcademicService.deleteAula(req.params.id);
        res.status(200).json({ status: 'success', message: result.message });
    });
}

export default new AcademicController();
