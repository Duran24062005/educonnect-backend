import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../utils/error.js';
import User from '../models/UserModel.js';

/**
 * protect
 * Middleware completo: exige token válido + perfil personal completado.
 * Úsalo en rutas que necesiten el rol del usuario (Admin, Teacher, Student).
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

    // Exigir que el perfil esté completo
    if (!user.person_id) {
        throw new AppError(
            'Perfil incompleto. Por favor completa tu información personal en /api/auth/complete-profile',
            403
        );
    }

    const person = user.person_id;

    if (person.status !== 'active') {
        throw new AppError('La cuenta no está activa', 403);
    }

    req.user = user;
    req.userId = decoded.sub;
    req.userRole = person.role; // 'Student' | 'Teacher' | 'Admin'
    req.personId = person._id;

    next();
});

/**
 * protectIncomplete
 * Solo verifica que el token sea válido.
 * NO exige que el perfil personal esté completo.
 * Úsalo exclusivamente en /api/auth/complete-profile.
 */
export const protectIncomplete = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization) {
        token = extractTokenFromHeader(req.headers.authorization);
    }

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

/**
 * authorize
 * Verifica que el usuario tenga uno de los roles indicados.
 * Comparación case-insensitive.
 * Uso recomendado: authorize('admin') o authorize('admin', 'teacher')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        const normalizeRole = (role) => String(role || '').trim().toLowerCase();
        const allowedRoles = roles.map(normalizeRole).filter(Boolean);
        const currentRole = normalizeRole(req.userRole);

        if (!allowedRoles.includes(currentRole)) {
            return next(
                new AppError(
                    `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
                    403
                )
            );
        }
        next();
    };
};

/**
 * optionalAuth
 * No lanza error si no hay token.
 * Si el token es válido y el perfil está completo, inyecta el usuario.
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
