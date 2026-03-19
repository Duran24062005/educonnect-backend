type AppErrorDetails = unknown;

export default class AppError extends Error {
    statusCode: number;
    status: 'fail' | 'error';
    isOperational: boolean;
    details: AppErrorDetails;

    constructor(message: string, statusCode = 500, details: AppErrorDetails = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
