import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isServerlessRuntime = () =>
    Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

export const getUploadsRootDir = () => (
    isServerlessRuntime()
        ? path.join('/tmp', 'educonnect-uploads')
        : path.resolve(__dirname, '../uploads')
);

export const ensureUploadDir = (subdir = '') => {
    const dir = subdir ? path.join(getUploadsRootDir(), subdir) : getUploadsRootDir();
    fs.mkdirSync(dir, { recursive: true });
    return dir;
};
