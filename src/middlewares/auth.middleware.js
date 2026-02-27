import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../utils/error.js';
import User from '../models/UserModel.js';

/**
 * Middleware de autenticación - verifica JWT y carga person_id populado
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization) {
        token = extractTokenFromHeader(req.headers.authorization);
    }

    if (!token) {
        throw new AppError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = verifyToken(token);

    // Cargar usuario con persona populada
    const user = await User.findById(decoded.sub).populate('person_id');

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    const person = user.person_id;

    if (!person || person.status !== 'active') {
        throw new AppError('La cuenta no está activa', 403);
    }

    req.user = user;
    req.userId = decoded.sub;
    req.userRole = person.role; // 'Student' | 'Teacher' | 'Admin'
    req.personId = person._id;

    next();
});

/**
 * Middleware de autorización por rol
 * Uso: authorize('Admin') o authorize('Admin', 'Teacher')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return next(
                new AppError(
                    `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
                    403
                )
            );
        }
        next();
    };
};

/**
 * Autenticación opcional - no lanza error si no hay token
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization) {
        token = extractTokenFromHeader(req.headers.authorization);
    }

    if (token) {
        try {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.sub).populate('person_id');

            if (user && user.person_id?.status === 'active') {
                req.user = user;
                req.userId = decoded.sub;
                req.userRole = user.person_id.role;
                req.personId = user.person_id._id;
            }
        } catch {
            // Token inválido — continúa sin autenticar
        }
    }

    next();
});