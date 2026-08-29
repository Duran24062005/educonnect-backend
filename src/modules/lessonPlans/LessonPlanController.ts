import { asyncHandler } from '../../utils/error.js';
import type { Request } from 'express';
import LessonPlanService from './LessonPlanService.js';

const context = (req: Request) => ({ ipAddress: req.ip, userAgent: req.get('user-agent') });

class LessonPlanController {
    getBySession = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await LessonPlanService.getBySession(req.userId, req.userRole, req.params.sessionId) }));
    create = asyncHandler(async (req, res) => res.status(201).json({ status: 'success', data: await LessonPlanService.create(req.userId, req.userRole, req.institutionId, req.body, context(req)) }));
    update = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await LessonPlanService.update(req.userId, req.userRole, req.institutionId, req.params.id, req.body, context(req)) }));
}

export default new LessonPlanController();
