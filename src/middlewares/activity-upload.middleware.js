import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AppError from '../utils/AppError.js';
import {
    ACTIVITY_ALLOWED_EXTENSIONS,
    ACTIVITY_FILE_SIZE_LIMIT,
    ACTIVITY_UPLOAD_SUBDIR,
} from '../constants/activity.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, `../uploads/${ACTIVITY_UPLOAD_SUBDIR}`);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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

const fileFilter = (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').replace('.', '').toLowerCase();
    if (!ACTIVITY_ALLOWED_EXTENSIONS.includes(extension)) {
        return cb(
            new AppError(
                `Formato inválido. Solo se permiten: ${ACTIVITY_ALLOWED_EXTENSIONS.join(', ')}`,
                400
            ),
            false
        );
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: ACTIVITY_FILE_SIZE_LIMIT },
    fileFilter,
});

export const uploadActivitySubmission = (req, res, next) => {
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
