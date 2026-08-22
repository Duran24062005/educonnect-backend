import type { RequestHandler } from 'express';
import appConfig from '../config/config.js';
import AppError from '../utils/AppError.js';

export const requireInstitutionContext: RequestHandler = (req, _res, next) => {
    if (appConfig.tenant.requireInstitutionContext && !req.institutionId) {
        return next(new AppError('El usuario debe pertenecer a una institución', 409));
    }

    return next();
};
