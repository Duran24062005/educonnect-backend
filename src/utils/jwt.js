import jwt from 'jsonwebtoken';
import { AppError } from './error.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generar JWT token de autenticación
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
 * Generar token de verificación de email
 * @param {string} email - Email del usuario
 * @returns {string} Token de verificación
 */
export const generateEmailToken = (email) => {
    return jwt.sign(
        {
            email: email,
            type: 'email_verification',
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn: '24h', // El token expira en 24 horas
        }
    );
};

/**
 * Generar token de recuperación de contraseña
 * @param {string} userId - ID del usuario
 * @param {string} email - Email del usuario
 * @returns {string} Token de recuperación
 */
export const generatePasswordResetToken = (userId, email) => {
    return jwt.sign(
        {
            sub: userId,
            email: email,
            type: 'password_reset',
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn: '1h', // El token expira en 1 hora
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
 * Verificar token de email
 * @param {string} token - Token a verificar
 * @returns {object} Datos decodificados del token
 */
export const verifyEmailToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'email_verification') {
            throw new AppError('Token inválido para verificación de email', 401);
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token de verificación expirado', 401);
        }
        throw new AppError('Token inválido', 401);
    }
};

/**
 * Verificar token de recuperación de contraseña
 * @param {string} token - Token a verificar
 * @returns {object} Datos decodificados del token
 */
export const verifyPasswordResetToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'password_reset') {
            throw new AppError('Token inválido para recuperación de contraseña', 401);
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token de recuperación expirado', 401);
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