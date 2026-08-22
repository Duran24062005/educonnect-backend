import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import AppError from '../utils/AppError.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const isCsv = file.originalname.toLowerCase().endsWith('.csv') ||
            ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'].includes(file.mimetype);
        if (!isCsv) return callback(new AppError('Solo se permite un archivo CSV', 400));
        return callback(null, true);
    },
});

export const uploadImportFile = (req: Request, res: Response, next: NextFunction): void => {
    upload.single('file')(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('El archivo supera el máximo de 2MB', 400));
        }
        return next(error);
    });
};
