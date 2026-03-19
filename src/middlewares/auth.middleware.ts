import type { RequestHandler } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { authorizeRoles } from './authorizeRoles.js';
import User from '../models/UserModel.js';

type AuthenticatedPerson = {
    _id: import('mongoose').Types.ObjectId;
    role: string;
    status: string;
};

export const protect = asyncHandler(async (req, _res, next) => {
    const token = req.headers.authorization
        ? extractTokenFromHeader(req.headers.authorization)
        : null;

    if (!token) {
        throw new AppError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = verifyToken(token);
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
    const user = await User.findById(decoded.sub);

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    req.user = user;
    req.userId = decoded.sub;

    next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
    const token = req.headers.authorization
        ? extractTokenFromHeader(req.headers.authorization)
        : null;

    if (token) {
        try {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.sub).populate('person_id');

            const person = user?.person_id as unknown as AuthenticatedPerson | undefined;
            if (user && person?.status === 'active') {
                req.user = user;
                req.userId = decoded.sub;
                req.userRole = person.role;
                req.personId = person._id;
            }
        } catch {
            // ignore invalid token for optional auth
        }
    }

    next();
});

export const authorize = (...roles: string[]): RequestHandler => authorizeRoles(...roles);
