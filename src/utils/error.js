/**
 * Custom Error Class
 * Permite crear errores con status codes personalizados
 */
export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error Handler Middleware
 * Maneja todos los errores de la aplicación
 */
export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log del error en desarrollo
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // Errores operacionales (conocidos)
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // Errores de programación o desconocidos
    console.error('💥 UNEXPECTED ERROR:', err);

    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
    });
};

/**
 * Async Handler Wrapper
 * Envuelve funciones async para capturar errores automáticamente
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};