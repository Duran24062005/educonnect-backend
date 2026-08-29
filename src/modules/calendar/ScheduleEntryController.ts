import { asyncHandler } from '../../utils/error.js';
import type { Request } from 'express';
import ScheduleEntryService from './ScheduleEntryService.js';

const context = (req: Request) => ({ ipAddress: req.ip, userAgent: req.get('user-agent') });

class ScheduleEntryController {
    list = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await ScheduleEntryService.list(req.params.id) }));
    create = asyncHandler(async (req, res) => res.status(201).json({ status: 'success', data: await ScheduleEntryService.create(req.userId, req.institutionId, req.params.id, req.body, context(req)) }));
    update = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await ScheduleEntryService.update(req.userId, req.institutionId, req.params.id, req.params.entryId, req.body, context(req)) }));
    archive = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await ScheduleEntryService.archive(req.userId, req.institutionId, req.params.id, req.params.entryId, context(req)) }));
}

export default new ScheduleEntryController();
