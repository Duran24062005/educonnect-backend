import type { RequestHandler } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authorizeRoles } from './authorizeRoles.js';
import User from '../models/UserModel.js';
import SessionService from '../modules/auth/SessionService.js';
import { enterTenantScope } from '../tenant/tenant-context.js';
import appConfig from '../config/config.js';

type AuthenticatedPerson = {
    _id: import('mongoose').Types.ObjectId;
    role: string;
    status: string;
};

const assertSessionIsActive = async (userId: string, jti?: string): Promise<void> => {
    // Tokens issued before session persistence was introduced remain valid only
    // during the migration window. All new application tokens include jti.
    if (!jti) return;

    if (!(await SessionService.isActive(userId, jti))) {
        throw new AppError('La sesión fue revocada o expiró', 401);
    }

    await SessionService.touch(jti);
};

export const protect = asyncHandler(async (req, _res, next) => {
    const token = req.headers.authorization
        ? extractTokenFromHeader(req.headers.authorization)
        : null;

    if (!token) {
        throw new AppError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = verifyToken(token);
    await assertSessionIsActive(decoded.sub, decoded.jti);
    const user = await User.findById(decoded.sub).populate('person_id');

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    if (!user.person_id) {
        throw new AppError(
            'Perfil incompleto. Completa tu información personal en /api/auth/complete-profile',
            403
        );
    }

    const person = user.person_id as unknown as AuthenticatedPerson;
    if (person.status !== 'active') {
        throw new AppError('La cuenta no está activa', 403);
    }

    req.user = user;
    req.userId = decoded.sub;
    req.userRole = person.role;
    req.personId = person._id;
    req.sessionId = decoded.jti;
    req.institutionId = user.institution_id?._id?.toString?.() || user.institution_id?.toString?.();
    if (req.institutionId) enterTenantScope({ institutionId: req.institutionId, enforce: appConfig.tenant.dataIsolation });

    next();
});

export const protectIncomplete = asyncHandler(async (req, _res, next) => {
    const token = req.headers.authorization
        ? extractTokenFromHeader(req.headers.authorization)
        : null;

    if (!token) {
        throw new AppError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = verifyToken(token);
    await assertSessionIsActive(decoded.sub, decoded.jti);
    const user = await User.findById(decoded.sub);

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    req.user = user;
    req.userId = decoded.sub;
    req.sessionId = decoded.jti;
    req.institutionId = user.institution_id?._id?.toString?.() || user.institution_id?.toString?.();
    if (req.institutionId) enterTenantScope({ institutionId: req.institutionId, enforce: appConfig.tenant.dataIsolation });

    next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
    const token = req.headers.authorization
        ? extractTokenFromHeader(req.headers.authorization)
        : null;

    if (token) {
        try {
            const decoded = verifyToken(token);
            await assertSessionIsActive(decoded.sub, decoded.jti);
            const user = await User.findById(decoded.sub).populate('person_id');

            const person = user?.person_id as unknown as AuthenticatedPerson | undefined;
            if (user && person?.status === 'active') {
                req.user = user;
                req.userId = decoded.sub;
                req.userRole = person.role;
                req.personId = person._id;
                req.sessionId = decoded.jti;
                req.institutionId = user.institution_id?._id?.toString?.() || user.institution_id?.toString?.();
                if (req.institutionId) enterTenantScope({ institutionId: req.institutionId, enforce: appConfig.tenant.dataIsolation });
            }
        } catch {
            // ignore invalid token for optional auth
        }
    }

    next();
});

export const authorize = (...roles: string[]): RequestHandler => authorizeRoles(...roles);
