import { DeleteObjectCommand, PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import appConfig from '../../config/config.js';
import AppError from '../../utils/AppError.js';
import type {
    ActivitySubmissionUploadInput,
    BuildSignedUrlInput,
    DeleteObjectInput,
    ProfilePhotoUploadInput,
    SignedUrlResult,
    StorageService,
    StoredFileMetadata,
    MaterialUploadInput,
} from './StorageService.js';

const STORAGE_PROVIDER = 'aws-s3';

const sanitizePathPart = (value: string, fallback: string) => {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return normalized || fallback;
};

const buildObjectKey = (segments: string[], originalName: string) => {
    const safeName = sanitizePathPart(originalName, 'file.bin');
    return [...segments, `${Date.now()}-${safeName}`].join('/');
};

class S3StorageService implements StorageService {
    private readonly client: S3Client;

    constructor() {
        this.client = new S3Client({
            region: appConfig.storage.awsRegion,
            credentials: appConfig.storage.accessKeyId && appConfig.storage.secretAccessKey
                ? {
                    accessKeyId: appConfig.storage.accessKeyId,
                    secretAccessKey: appConfig.storage.secretAccessKey,
                }
                : undefined,
        });
    }

    private ensureConfigured() {
        if (!appConfig.storage.s3Bucket) {
            throw new AppError('AWS_S3_BUCKET no está configurado', 500);
        }
    }

    private async putObject(key: string, input: ProfilePhotoUploadInput | ActivitySubmissionUploadInput | MaterialUploadInput) {
        this.ensureConfigured();
        await this.client.send(
            new PutObjectCommand({
                Bucket: appConfig.storage.s3Bucket,
                Key: key,
                Body: input.buffer,
                ContentType: input.mimeType,
                Metadata: {
                    originalName: input.originalName,
                },
            })
        );

        const signed = await this.buildSignedUrl({
            bucket: appConfig.storage.s3Bucket,
            key,
        });

        return {
            provider: STORAGE_PROVIDER,
            bucket: appConfig.storage.s3Bucket,
            key,
            signedUrl: signed.url,
            signedUrlExpiresAt: signed.expiresAt,
        } satisfies StoredFileMetadata;
    }

    async uploadProfilePhoto(input: ProfilePhotoUploadInput): Promise<StoredFileMetadata> {
        const key = buildObjectKey(['profiles', sanitizePathPart(input.userId, 'user')], input.originalName);
        return await this.putObject(key, input);
    }

    async uploadActivitySubmission(input: ActivitySubmissionUploadInput): Promise<StoredFileMetadata> {
        const key = buildObjectKey(
            [
                'activity-submissions',
                sanitizePathPart(input.activityId, 'activity'),
                sanitizePathPart(input.studentId, 'student'),
            ],
            input.originalName
        );
        return await this.putObject(key, input);
    }

    async uploadMaterial(input: MaterialUploadInput): Promise<StoredFileMetadata> {
        const key = buildObjectKey(['session-materials', sanitizePathPart(input.sessionId, 'session')], input.originalName);
        return await this.putObject(key, input);
    }

    async deleteObject({ bucket, key }: DeleteObjectInput): Promise<void> {
        if (!bucket || !key) return;
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );
    }

    async buildSignedUrl({ bucket, key }: BuildSignedUrlInput): Promise<SignedUrlResult> {
        this.ensureConfigured();
        const expiresIn = Math.max(appConfig.storage.signedUrlTtlSeconds, 60);
        const url = await getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
            { expiresIn }
        );

        return {
            url,
            expiresAt: new Date(Date.now() + (expiresIn * 1000)),
        };
    }

    isSignedUrlStale(expiresAt?: Date | string | null): boolean {
        if (!expiresAt) return true;
        const value = new Date(expiresAt);
        if (Number.isNaN(value.getTime())) return true;
        const marginMs = appConfig.storage.signedUrlRefreshMarginSeconds * 1000;
        return value.getTime() <= (Date.now() + marginMs);
    }
}

export default S3StorageService;
