import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import AppError from '../utils/AppError.js';

type MongooseLikeError = {
    name?: string;
    path?: string;
    value?: unknown;
    errors?: Record<string, { path?: string; message?: string }>;
    code?: number;
    keyValue?: Record<string, unknown>;
};

type ErrorResponseBody = {
    status: string;
    message: string;
    details?: unknown;
    stack?: string;
};

const mongooseErrorToAppError = (error: MongooseLikeError | unknown): AppError | unknown => {
    if (typeof error !== 'object' || error === null) {
        return error;
    }

    const err = error as MongooseLikeError;
    if (err.name === 'CastError') {
        return new AppError(`Invalid ${err.path}: ${String(err.value)}`, 400);
    }

    if (err.name === 'ValidationError' && err.errors) {
        const details = Object.values(err.errors).map((validationError) => ({
            field: validationError.path,
            message: validationError.message,
        }));

        return new AppError('Validation failed', 400, details);
    }

    if (err.code === 11000) {
        const duplicatedFields = Object.keys(err.keyValue || {});
        return new AppError(`Duplicate value for: ${duplicatedFields.join(', ')}`, 409, err.keyValue);
    }

    return error;
};

export const notFoundHandler: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    let err = error;

    if (!(err instanceof AppError)) {
        err = mongooseErrorToAppError(err);
    }

    if (!(err instanceof AppError)) {
        err = new AppError(err instanceof Error ? err.message : 'Internal server error', 500);
    }

    const appError = err as AppError;
    const statusCode = appError.statusCode || 500;
    const response: ErrorResponseBody = {
        status: appError.status || 'error',
        message: appError.message || 'Internal server error',
    };

    if (appError.details) {
        response.details = appError.details;
    }

    if (process.env.NODE_ENV !== 'production' && !appError.isOperational) {
        response.stack = appError.stack;
    }

    if (process.env.NODE_ENV !== 'test') {
        const logLevel = statusCode >= 500 ? 'error' : 'warn';
        console[logLevel]('[API Error]', {
            statusCode,
            message: appError.message,
            isOperational: appError.isOperational,
        });
    }

    return res.status(statusCode).json(response);
};
