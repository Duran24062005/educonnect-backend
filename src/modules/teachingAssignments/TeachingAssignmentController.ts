import { asyncHandler } from '../../utils/error.js';
import type { Request } from 'express';
import TeachingAssignmentService from './TeachingAssignmentService.js';

const context = (req: Request) => ({ ipAddress: req.ip, userAgent: req.get('user-agent') });

class TeachingAssignmentController {
    list = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await TeachingAssignmentService.list(req.userId, req.userRole, req.query) }));
    get = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await TeachingAssignmentService.get(req.params.id, req.userId, req.userRole) }));
    create = asyncHandler(async (req, res) => res.status(201).json({ status: 'success', data: await TeachingAssignmentService.create(req.userId, req.institutionId, req.body, context(req)) }));
    update = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await TeachingAssignmentService.update(req.userId, req.institutionId, req.params.id, req.body, context(req)) }));
}

export default new TeachingAssignmentController();
