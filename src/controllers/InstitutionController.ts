import { asyncHandler, AppError } from '../utils/error.js';
import InstitutionService from '../services/InstitutionService.js';

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

    assignUser = asyncHandler(async (req, res) => {
        const user = await InstitutionService.assignUser(authContext(req), String(req.params.user_id));
        res.status(200).json({ status: 'success', data: user });
    });
}

export default new InstitutionController();
