import type { Request } from 'express';
import { asyncHandler } from '../utils/error.js';
import CalendarService from '../services/CalendarService.js';

const requestContext = (req: Request) => ({
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
});

class CalendarController {
    getCalendar = asyncHandler(async (req, res) => {
        const result = await CalendarService.list(req.query, req.userRole, req.userId);
        res.status(200).json({ status: 'success', data: result });
    });

    getMyCalendar = asyncHandler(async (req, res) => {
        const result = await CalendarService.list(req.query, req.userRole, req.userId);
        res.status(200).json({ status: 'success', data: result });
    });

    getCatalog = asyncHandler(async (req, res) => {
        const result = await CalendarService.catalog(req.userRole, req.userId, req.query.school_year_id);
        res.status(200).json({ status: 'success', data: result });
    });

    createSession = asyncHandler(async (req, res) => {
        const result = await CalendarService.create(
            req.userId,
            req.userRole,
            req.institutionId,
            req.body,
            requestContext(req)
        );
        res.status(201).json({ status: 'success', data: result });
    });

    updateSession = asyncHandler(async (req, res) => {
        const result = await CalendarService.update(
            req.userId,
            req.userRole,
            req.institutionId,
            req.params.id,
            req.body,
            requestContext(req)
        );
        res.status(200).json({ status: 'success', data: result });
    });
}

export default new CalendarController();
