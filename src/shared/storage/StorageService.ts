export interface StorageUploadInput {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
}

export interface ProfilePhotoUploadInput extends StorageUploadInput {
    userId: string;
}

export interface ActivitySubmissionUploadInput extends StorageUploadInput {
    activityId: string;
    studentId: string;
}

export interface MaterialUploadInput extends StorageUploadInput {
    sessionId: string;
}

export interface SignedUrlResult {
    url: string;
    expiresAt: Date;
}

export interface StoredFileMetadata {
    provider: string;
    bucket: string;
    key: string;
    signedUrl: string;
    signedUrlExpiresAt: Date;
}

export interface DeleteObjectInput {
    bucket: string;
    key: string;
}

export interface BuildSignedUrlInput {
    bucket: string;
    key: string;
}

export interface StorageService {
    uploadProfilePhoto(input: ProfilePhotoUploadInput): Promise<StoredFileMetadata>;
    uploadActivitySubmission(input: ActivitySubmissionUploadInput): Promise<StoredFileMetadata>;
    uploadMaterial(input: MaterialUploadInput): Promise<StoredFileMetadata>;
    deleteObject(input: DeleteObjectInput): Promise<void>;
    buildSignedUrl(input: BuildSignedUrlInput): Promise<SignedUrlResult>;
    isSignedUrlStale(expiresAt?: Date | string | null): boolean;
}
