import asyncHandler from '../utils/asyncHandler.js';
import GuardianService from '../services/GuardianService.js';
import AttendanceService from '../services/AttendanceService.js';
import { getQueryString } from '../utils/request.js';

class GuardianController {
    getMyStudents = asyncHandler(async (req, res) => {
        const data = await GuardianService.getMyStudents(req.userId);
        res.status(200).json({ status: 'success', data });
    });

    getDashboard = asyncHandler(async (req, res) => {
        const data = await GuardianService.getDashboard(
            req.userId,
            getQueryString(req.query.school_year_id)
        );
        res.status(200).json({ status: 'success', data });
    });

    getAttendance = asyncHandler(async (req, res) => {
        const data = await AttendanceService.getGuardianSummary(
            req.userId,
            getQueryString(req.query.school_year_id)
        );
        res.status(200).json({ status: 'success', data });
    });

    getBulletin = asyncHandler(async (req, res) => {
        const data = await GuardianService.getBulletin(
            req.userId,
            getQueryString(req.query.school_year_id),
            getQueryString(req.query.period_id),
            getQueryString(req.query.student_id)
        );
        res.status(200).json({ status: 'success', data });
    });
}

export default new GuardianController();
