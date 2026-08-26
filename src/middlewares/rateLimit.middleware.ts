import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import appConfig from '../config/config.js';

/**
 * Rate limiting (H5).
 * Se desactiva en entorno de test para no interferir con la suite de integración.
 */

const passThrough: RequestHandler = (_req, _res, next) => next();

const make = (options: Parameters<typeof rateLimit>[0]): RequestHandler => {
    if (appConfig.app.nodeEnv === 'test') {
        return passThrough;
    }
    return rateLimit(options);
};

const tooManyRequestsMessage = {
    status: 'fail',
    message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
};

// El frontend es cross-origin: cada POST dispara una preflight OPTIONS que no
// debe consumir cuota del limitador (duplicaría el consumo de intentos reales).
const skipOptions = (req: { method?: string }) => req.method === 'OPTIONS';

/** Límite global por IP: 300 solicitudes / 15 minutos */
export const globalLimiter = make({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: tooManyRequestsMessage,
    skip: skipOptions,
});

/** Login: 10 intentos / 15 minutos por IP (anti brute-force) */
export const loginLimiter = make({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: tooManyRequestsMessage,
    skip: skipOptions,
});

/** Registro: 20 cuentas / hora por IP (anti spam de cuentas) */
export const registerLimiter = make({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: tooManyRequestsMessage,
    skip: skipOptions,
});

/** Password reset requests: 5 attempts / 15 minutes per IP. */
export const passwordResetRequestLimiter = make({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: tooManyRequestsMessage,
    skip: skipOptions,
});

/** Password reset code validation: 10 attempts / 15 minutes per IP. */
export const passwordResetVerifyLimiter = make({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: tooManyRequestsMessage,
    skip: skipOptions,
});
