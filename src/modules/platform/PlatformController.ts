import { asyncHandler, AppError } from '../../utils/error.js';
import PlatformService from './PlatformService.js';

const actor = (req: { userId?: string }) => {
    if (!req.userId) throw new AppError('Contexto de autenticación incompleto', 401);
    return req.userId;
};

const context = (req: any) => ({ ipAddress: req.ip, userAgent: req.get('user-agent') });

class PlatformController {
    list = asyncHandler(async (req, res) => {
        const data = await PlatformService.list(req.query, Number(req.query.page) || 1, Number(req.query.limit) || 10);
        res.status(200).json({ status: 'success', data });
    });

    getById = asyncHandler(async (req, res) => {
        res.status(200).json({ status: 'success', data: await PlatformService.getById(String(req.params.id)) });
    });

    create = asyncHandler(async (req, res) => {
        const data = await PlatformService.create(actor(req), req.body, context(req));
        res.status(201).json({ status: 'success', data });
    });

    assignPrimaryAdmin = asyncHandler(async (req, res) => {
        const data = await PlatformService.assignPrimaryAdmin(String(req.params.id), req.body, actor(req), context(req));
        res.status(201).json({ status: 'success', data });
    });

    update = asyncHandler(async (req, res) => {
        const data = await PlatformService.update(String(req.params.id), req.body, actor(req), context(req));
        res.status(200).json({ status: 'success', data });
    });

    changeStatus = asyncHandler(async (req, res) => {
        const data = await PlatformService.changeStatus(String(req.params.id), req.body.status, actor(req), context(req));
        res.status(200).json({ status: 'success', data });
    });

    resendInvitation = asyncHandler(async (req, res) => {
        const data = await PlatformService.resendInvitation(String(req.params.id), actor(req), context(req));
        res.status(200).json({ status: 'success', data });
    });
}

export default new PlatformController();
