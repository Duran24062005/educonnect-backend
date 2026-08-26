import S3StorageService from './S3StorageService.js';
import type { StorageService } from './StorageService.js';

declare global {
    var __EDUCONNECT_STORAGE_SERVICE__: StorageService | undefined;
}

const defaultStorageService = new S3StorageService();

export const getStorageService = (): StorageService => (
    globalThis.__EDUCONNECT_STORAGE_SERVICE__ || defaultStorageService
);
