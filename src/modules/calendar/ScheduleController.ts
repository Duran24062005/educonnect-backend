import type { Request } from 'express';
import { asyncHandler } from '../../utils/error.js';
import ScheduleService from './ScheduleService.js';

const context = (req: Request) => ({ ipAddress: req.ip, userAgent: req.get('user-agent') });

class ScheduleController {
    list = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await ScheduleService.list(req.institutionId, req.query) }));
    createDraft = asyncHandler(async (req, res) => res.status(201).json({ status: 'success', data: await ScheduleService.createDraft(req.userId, req.institutionId, req.body.school_year_id) }));
    update = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await ScheduleService.updateDraft(req.userId, req.params.id, req.body) }));
    publish = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await ScheduleService.publish(req.userId, req.institutionId, req.params.id, context(req)) }));
}

export default new ScheduleController();
