import jwt from 'jsonwebtoken';
import { AppError } from './error.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generar JWT token
 * @param {string} userId - ID del usuario
 * @param {string} role - Rol del usuario
 * @returns {string} JWT token
 */
export const generateToken = (userId, role) => {
    return jwt.sign(
        {
            sub: userId,
            role: role,
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRE,
        }
    );
};

/**
 * Verificar JWT token
 * @param {string} token - JWT token a verificar
 * @returns {object} Decoded token
 * @throws {AppError} Si el token es inválido
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expirado', 401);
        }
        throw new AppError('Token inválido', 401);
    }
};

/**
 * Extraer token del header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token o null
 */
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7); // Remover 'Bearer '
};