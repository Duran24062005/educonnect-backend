import { asyncHandler, AppError } from '../../utils/error.js';
import InstitutionService from './InstitutionService.js';

const authContext = (req: { userId?: string }) => {
    if (!req.userId) throw new AppError('Contexto de autenticación incompleto', 401);
    return req.userId;
};

class InstitutionController {
    create = asyncHandler(async (req, res) => {
        const institution = await InstitutionService.create(authContext(req), req.body);
        res.status(201).json({ status: 'success', data: institution });
    });

    getCurrent = asyncHandler(async (req, res) => {
        const institution = await InstitutionService.getCurrent(authContext(req));
        res.status(200).json({ status: 'success', data: institution });
    });

    getScheduleConfig = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.getScheduleConfig(authContext(req)) }));

    assignUser = asyncHandler(async (req, res) => {
        const user = await InstitutionService.assignUser(authContext(req), String(req.params.user_id));
        res.status(200).json({ status: 'success', data: user });
    });

    listCampuses = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.listCampuses(authContext(req)) }));
    createCampus = asyncHandler(async (req, res) => res.status(201).json({ status: 'success', data: await InstitutionService.createCampus(authContext(req), req.body) }));
    updateCampus = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.updateCampus(authContext(req), String(req.params.id), req.body) }));
    deleteCampus = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.deleteCampus(authContext(req), String(req.params.id)) }));
    listShifts = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.listShifts(authContext(req)) }));
    createShift = asyncHandler(async (req, res) => res.status(201).json({ status: 'success', data: await InstitutionService.createShift(authContext(req), req.body) }));
    updateShift = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.updateShift(authContext(req), String(req.params.id), req.body) }));
    deleteShift = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.deleteShift(authContext(req), String(req.params.id)) }));
    updateScheduleConfig = asyncHandler(async (req, res) => res.status(200).json({ status: 'success', data: await InstitutionService.updateScheduleConfig(authContext(req), req.body) }));
}

export default new InstitutionController();
