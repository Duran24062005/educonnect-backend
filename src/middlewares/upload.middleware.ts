import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import AppError from '../utils/AppError.js';

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
): void => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new AppError('Formato inválido. Solo se permite jpeg, png o webp', 400));
    }
    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

export const uploadProfilePhoto = (req: Request, res: Response, next: NextFunction): void => {
    upload.single('profile_photo')(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new AppError('La imagen supera el máximo permitido de 5MB', 400));
            }
            if (err.code === 'MISSING_FIELD_NAME') {
                return next(
                    new AppError(
                        'Campo inválido en form-data. Usa la llave profile_photo y selecciona un archivo',
                        400
                    )
                );
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return next(
                    new AppError(
                        'Campo inesperado. Usa únicamente la llave profile_photo para la imagen',
                        400
                    )
                );
            }
        }

        return next(err);
    });
};
