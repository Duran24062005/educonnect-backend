import jwt from 'jsonwebtoken';
import appConfig from '../config/config.js';
import AppError from './AppError.js';

const JWT_SECRET = appConfig.jwt.secret;
const JWT_EXPIRE = appConfig.jwt.expire;

export const generateToken = (userId, role) => {
    return jwt.sign(
        {
            sub: userId,
            role,
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRE,
        }
    );
};

export const generateEmailToken = (email) => {
    return jwt.sign(
        {
            email,
            type: 'email_verification',
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn: '24h',
        }
    );
};

export const generatePasswordResetToken = (userId, email) => {
    return jwt.sign(
        {
            sub: userId,
            email,
            type: 'password_reset',
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn: '1h',
        }
    );
};

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

export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice(7);
};
