import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import appConfig from '../config/config.js';
import AppError from './AppError.js';
import type { JwtClaims } from '../types/auth.js';

const JWT_SECRET = appConfig.jwt.secret;
const JWT_EXPIRE = appConfig.jwt.expire;

const asJwtClaims = (decoded: string | JwtPayload): JwtClaims => {
    if (typeof decoded === 'string') {
        throw new AppError('Token inválido', 401);
    }

    return decoded as JwtClaims;
};

const isExpiredTokenError = (error: unknown): boolean =>
    error instanceof Error && error.name === 'TokenExpiredError';

export const generateToken = (userId: string, role?: string, jti?: string): string => {
    return jwt.sign(
        {
            sub: userId,
            role,
            ...(jti ? { jti } : {}),
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRE as SignOptions['expiresIn'],
        } satisfies SignOptions
    );
};

export const generateSessionToken = (
    userId: string,
    role: string | null | undefined,
    jti: string
): { token: string; jti: string } => ({
    token: generateToken(userId, role || undefined, jti),
    jti,
});

export const generateEmailToken = (email: string): string => {
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

export const generatePasswordResetToken = (userId: string, email: string): string => {
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

export const verifyToken = (token: string): JwtClaims => {
    try {
        return asJwtClaims(jwt.verify(token, JWT_SECRET));
    } catch (error) {
        if (isExpiredTokenError(error)) {
            throw new AppError('Token expirado', 401);
        }
        throw new AppError('Token inválido', 401);
    }
};

export const verifyEmailToken = (token: string): JwtClaims => {
    try {
        const decoded = asJwtClaims(jwt.verify(token, JWT_SECRET));
        if (decoded.type !== 'email_verification') {
            throw new AppError('Token inválido para verificación de email', 401);
        }
        return decoded;
    } catch (error) {
        if (isExpiredTokenError(error)) {
            throw new AppError('Token de verificación expirado', 401);
        }
        throw new AppError('Token inválido', 401);
    }
};

export const verifyPasswordResetToken = (token: string): JwtClaims => {
    try {
        const decoded = asJwtClaims(jwt.verify(token, JWT_SECRET));
        if (decoded.type !== 'password_reset') {
            throw new AppError('Token inválido para recuperación de contraseña', 401);
        }
        return decoded;
    } catch (error) {
        if (isExpiredTokenError(error)) {
            throw new AppError('Token de recuperación expirado', 401);
        }
        throw new AppError('Token inválido', 401);
    }
};

export const extractTokenFromHeader = (authHeader?: string | null): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice(7);
};
