import AppError from '../utils/AppError.js';

const mongooseErrorToAppError = (error) => {
    if (error.name === 'CastError') {
        return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
    }

    if (error.name === 'ValidationError') {
        const details = Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message,
        }));

        return new AppError('Validation failed', 400, details);
    }

    if (error.code === 11000) {
        const duplicatedFields = Object.keys(error.keyValue || {});
        return new AppError(`Duplicate value for: ${duplicatedFields.join(', ')}`, 409, error.keyValue);
    }

    return error;
};

export const notFoundHandler = (req, _res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

export const errorHandler = (error, _req, res, _next) => {
    let err = error;

    if (!(err instanceof AppError)) {
        err = mongooseErrorToAppError(err);
    }

    const statusCode = err.statusCode || 500;
    const response = {
        status: err.status || 'error',
        message: err.message || 'Internal server error',
    };

    if (err.details) {
        response.details = err.details;
    }

    if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
        response.stack = err.stack;
    }

    if (process.env.NODE_ENV !== 'test') {
        const logLevel = statusCode >= 500 ? 'error' : 'warn';
        console[logLevel]('[API Error]', {
            statusCode,
            message: err.message,
            isOperational: err.isOperational,
        });
    }

    return res.status(statusCode).json(response);
};
