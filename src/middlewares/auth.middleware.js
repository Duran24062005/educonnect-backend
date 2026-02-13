import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../utils/error.js';
import User from '../models/UserModel.js';

/**
 * Middleware para proteger rutas - Verifica JWT
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Extraer token del header
    if (req.headers.authorization) {
        token = extractTokenFromHeader(req.headers.authorization);
    }

    // Validar que existe token
    if (!token) {
        throw new AppError('No autorizado - Token no proporcionado', 401);
    }

    // Verificar token
    const decoded = verifyToken(token);

    // Obtener usuario de la base de datos
    const user = await User.findById(decoded.sub);

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar que el usuario está activo
    if (user.status !== 'active') {
        throw new AppError('El usuario no está activo', 403);
    }

    // Adjuntar usuario a la request
    req.user = user;
    req.userId = decoded.sub;
    req.userRole = decoded.role;

    next();
});

/**
 * Middleware para autorizar por rol
 * @param {...string} roles - Roles permitidos
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return next(
                new AppError(
                    `No tienes permiso para acceder a este recurso (Rol requerido: ${roles.join(', ')})`,
                    403
                )
            );
        }
        next();
    };
};

/**
 * Middleware opcional para autenticación (no lanza error si no hay token)
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization) {
        token = extractTokenFromHeader(req.headers.authorization);
    }

    if (token) {
        try {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.sub);

            if (user && user.status === 'active') {
                req.user = user;
                req.userId = decoded.sub;
                req.userRole = decoded.role;
            }
        } catch (error) {
            // Silenciosamente ignorar errores de token
            // El usuario no estará autenticado pero la ruta continúa
        }
    }

    next();
});