import { asyncHandler } from '../../utils/error.js';
import GroupService from './GroupService.js';
import { serializeCsv } from '../../utils/csv.js';
import { getQueryString } from '../../utils/request.js';

class GroupController {
    // ---- GRUPOS ----
    createGroup = asyncHandler(async (req, res) => {
        const result = await GroupService.createGroup(req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getGroupsBySchoolYear = asyncHandler(async (req, res) => {
        const result = await GroupService.getGroupsBySchoolYear(req.params.school_year_id);
        res.status(200).json({ status: 'success', data: result, groups: result });
    });

    getGroupById = asyncHandler(async (req, res) => {
        const result = await GroupService.getGroupById(req.params.id, req.userId, req.userRole);
        res.status(200).json({ status: 'success', data: result });
    });

    getGroupDetailSummary = asyncHandler(async (req, res) => {
        const result = await GroupService.getGroupDetailSummary(req.params.group_id);
        res.status(200).json({ status: 'success', data: result });
    });

    updateGroup = asyncHandler(async (req, res) => {
        const result = await GroupService.updateGroup(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: result });
    });

    deleteGroup = asyncHandler(async (req, res) => {
        const result = await GroupService.deleteGroup(req.params.id);
        res.status(200).json({ status: 'success', message: result.message });
    });

    // ---- INSCRIPCIONES ----
    enrollStudent = asyncHandler(async (req, res) => {
        const { student_id, group_id, school_year_id, campus_id, shift_id } = req.body;
        const result = await GroupService.enrollStudent(student_id, group_id, school_year_id, {
            actorUserId: req.userId,
            actorRole: req.userRole,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        }, { campus_id, shift_id });
        res.status(201).json({ status: 'success', message: 'Estudiante inscrito exitosamente', data: result });
    });

    transferEnrollment = asyncHandler(async (req, res) => {
        const { student_id, school_year_id, to_group_id, reason, observations, campus_id, shift_id } = req.body;
        const result = await GroupService.transferEnrollment(
            student_id,
            school_year_id,
            to_group_id,
            reason,
            observations,
            {
                actorUserId: req.userId,
                actorRole: req.userRole,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
            { campus_id, shift_id }
        );
        res.status(201).json({
            status: 'success',
            message: 'Traslado de grupo realizado exitosamente',
            data: result,
        });
    });

    changeEnrollmentStatus = asyncHandler(async (req, res) => {
        const { status } = req.body;
        const result = await GroupService.changeEnrollmentStatus(req.params.id, status, {
            actorUserId: req.userId,
            actorRole: req.userRole,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.status(200).json({ status: 'success', data: result });
    });

    getStudentsByGroup = asyncHandler(async (req, res) => {
        const result = await GroupService.getStudentsByGroup(
            req.params.group_id,
            req.userId,
            req.userRole
        );
        res.status(200).json({ status: 'success', data: result });
    });

    getEnrollmentsByStudent = asyncHandler(async (req, res) => {
        const result = await GroupService.getEnrollmentsByStudent(
            req.params.student_id,
            req.userId,
            req.userRole
        );
        res.status(200).json({ status: 'success', data: result });
    });

    downloadEnrollmentReport = asyncHandler(async (req, res) => {
        const rows = await GroupService.getEnrollmentReport(
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.group_id) || '',
            req.userRole
        );
        const csv = serializeCsv(
            ['school_year', 'group', 'grade', 'student', 'email', 'campus', 'shift', 'status'],
            rows
        );
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="enrollment-report.csv"');
        res.status(200).send(String.fromCharCode(0xFEFF) + csv);
    });

    // ---- ASIGNACIÓN DE PROFESORES ----
    assignTeacher = asyncHandler(async (req, res) => {
        const { teacher_id, group_id, area_id } = req.body;
        const result = await GroupService.assignTeacherToGroup(teacher_id, group_id, area_id, {
            actorUserId: req.userId,
            actorRole: req.userRole,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
        res.status(201).json({ status: 'success', message: 'Profesor asignado exitosamente', data: result });
    });

    getTeachersByGroup = asyncHandler(async (req, res) => {
        const result = await GroupService.getTeachersByGroup(
            req.params.group_id,
            req.userId,
            req.userRole
        );
        res.status(200).json({ status: 'success', data: result });
    });

    getGroupsByTeacher = asyncHandler(async (req, res) => {
        const result = await GroupService.getGroupsByTeacher(
            req.params.teacher_id,
            req.userId,
            req.userRole
        );
        res.status(200).json({ status: 'success', data: result });
    });

    // ---- GRADE AREAS ----
    assignAreaToGrade = asyncHandler(async (req, res) => {
        const { grade_id, area_id, weekly_hours } = req.body;
        const result = await GroupService.assignAreaToGrade(grade_id, area_id, weekly_hours);
        res.status(201).json({ status: 'success', data: result });
    });

    getAreasByGrade = asyncHandler(async (req, res) => {
        const result = await GroupService.getAreasByGrade(req.params.grade_id);
        res.status(200).json({ status: 'success', data: result });
    });
}

export default new GroupController();
