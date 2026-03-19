import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import AppError from '../utils/AppError.js';
import {
    ACTIVITY_ALLOWED_EXTENSIONS,
    ACTIVITY_FILE_SIZE_LIMIT,
    ACTIVITY_UPLOAD_SUBDIR,
} from '../constants/activity.constants.js';
import { ensureUploadDir } from '../utils/uploads.js';

const uploadDir = ensureUploadDir(ACTIVITY_UPLOAD_SUBDIR);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeUserId = String(req.userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '');
        const safeActivityId = String(req.params.activity_id || 'activity').replace(/[^a-zA-Z0-9_-]/g, '');
        const extension = path.extname(file.originalname || '').toLowerCase() || '.bin';
        cb(null, `${safeActivityId}-${safeUserId}-${Date.now()}${extension}`);
    },
});

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
): void => {
    const extension = path.extname(file.originalname || '').replace('.', '').toLowerCase();
    if (!(ACTIVITY_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
        return cb(
            new AppError(
                `Formato inválido. Solo se permiten: ${ACTIVITY_ALLOWED_EXTENSIONS.join(', ')}`,
                400
            )
        );
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: ACTIVITY_FILE_SIZE_LIMIT },
    fileFilter,
});

export const uploadActivitySubmission = (req: Request, res: Response, next: NextFunction): void => {
    upload.single('submission_file')(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new AppError('El archivo supera el máximo permitido de 20MB', 400));
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return next(
                    new AppError(
                        'Campo inesperado. Usa únicamente la llave submission_file para el archivo',
                        400
                    )
                );
            }
        }

        return next(err);
    });
};
