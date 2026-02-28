import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../uploads/profiles');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeUserId = String(req.params.id || 'user').replace(/[^a-zA-Z0-9_-]/g, '');
        const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${safeUserId}-${Date.now()}${extension}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new AppError('Formato inválido. Solo se permite jpeg, png o webp', 400), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

export const uploadProfilePhoto = (req, res, next) => {
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
