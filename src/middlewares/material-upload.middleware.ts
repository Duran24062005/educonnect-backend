import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import AppError from '../utils/AppError.js';
import appConfig from '../config/config.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: appConfig.storage.materialFileSizeLimitBytes },
});

export const uploadMaterialFile = (req: Request, res: Response, next: NextFunction): void => {
    upload.single('material_file')(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            const megabytes = Math.round(appConfig.storage.materialFileSizeLimitBytes / (1024 * 1024));
            return next(new AppError(`El archivo supera el máximo permitido de ${megabytes}MB`, 400));
        }
        if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('Campo inesperado. Usa únicamente la llave material_file para el archivo', 400));
        }
        return next(err);
    });
};
