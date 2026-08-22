import asyncHandler from '../utils/asyncHandler.js';
import AttendanceService from '../services/AttendanceService.js';
import { getQueryString } from '../utils/request.js';
import { serializeCsv } from '../utils/csv.js';

const actor = (req: any) => ({
    userId: req.userId,
    role: req.userRole,
    institutionId: req.institutionId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
});

class AttendanceController {
    createSession = asyncHandler(async (req, res) => {
        const data = await AttendanceService.createSession(req.body, actor(req));
        res.status(201).json({ status: 'success', data });
    });

    listSessions = asyncHandler(async (req, res) => {
        const data = await AttendanceService.listSessions({
            school_year_id: getQueryString(req.query.school_year_id),
            group_id: getQueryString(req.query.group_id),
            from: getQueryString(req.query.from),
            to: getQueryString(req.query.to),
        }, actor(req));
        res.status(200).json({ status: 'success', data: { sessions: data } });
    });

    getInstitutionalReport = asyncHandler(async (req, res) => {
        const data = await AttendanceService.getInstitutionalReport({
            school_year_id: getQueryString(req.query.school_year_id),
            group_id: getQueryString(req.query.group_id),
            from: getQueryString(req.query.from),
            to: getQueryString(req.query.to),
        }, actor(req));
        res.status(200).json({ status: 'success', data });
    });

    downloadInstitutionalReport = asyncHandler(async (req, res) => {
        const data = await AttendanceService.getInstitutionalReport({
            school_year_id: getQueryString(req.query.school_year_id),
            group_id: getQueryString(req.query.group_id),
            from: getQueryString(req.query.from),
            to: getQueryString(req.query.to),
        }, actor(req));
        const csv = serializeCsv(
            ['date', 'group', 'grade', 'area', 'topic', 'student', 'status', 'note', 'justification'],
            data.rows
        );
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
        res.status(200).send(String.fromCharCode(0xFEFF) + csv);
    });

    getSession = asyncHandler(async (req, res) => {
        const data = await AttendanceService.getSession(req.params.id, actor(req));
        res.status(200).json({ status: 'success', data });
    });

    updateRecords = asyncHandler(async (req, res) => {
        const data = await AttendanceService.updateRecords(req.params.id, req.body.records, actor(req));
        res.status(200).json({ status: 'success', data });
    });

    updateStatus = asyncHandler(async (req, res) => {
        const data = await AttendanceService.updateSessionStatus(req.params.id, req.body.status, actor(req));
        res.status(200).json({ status: 'success', data });
    });

    getStudentSummary = asyncHandler(async (req, res) => {
        const data = await AttendanceService.getStudentSummary(
            req.params.student_id,
            getQueryString(req.query.school_year_id),
            actor(req)
        );
        res.status(200).json({ status: 'success', data });
    });
}

export default new AttendanceController();
