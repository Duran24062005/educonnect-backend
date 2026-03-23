import 'dotenv/config';
import mongoose from 'mongoose';

interface AppSection {
    name: string;
    port: number;
    nodeEnv: string;
    emailApiBase: string;
}

interface DatabaseSection {
    url: string;
    username: string;
    password: string;
}

interface JwtSection {
    secret: string;
    expire: string;
}

interface CorsSection {
    origins: string[];
}

interface StorageSection {
    awsRegion: string;
    s3Bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    signedUrlTtlSeconds: number;
    signedUrlRefreshMarginSeconds: number;
}

class AppConfig {
    static instance: AppConfig | undefined;
    app!: AppSection;
    database!: DatabaseSection;
    jwt!: JwtSection;
    cors!: CorsSection;
    storage!: StorageSection;

    constructor() {
        if (AppConfig.instance) return AppConfig.instance;

        const defaultMongoUri = 'mongodb://admin:admin123@localhost:27017/educonnect?authSource=admin';
        const databaseUrl = process.env.DATABASE_URL || process.env.MONGO_URI_CLOUD || defaultMongoUri;

        this.app = {
            name: 'EduConnect Backend',
            port: Number(process.env.PORT || 8000),
            nodeEnv: process.env.NODE_ENV || 'development',
            emailApiBase: process.env.EMAIL_API_BASE_URL || 'http://localhost:8000/',
        };

        this.database = {
            url: databaseUrl,
            username: process.env.MONGO_USERNAME || 'admin',
            password: process.env.MONGO_PASSWORD || 'admin123',
        };

        this.jwt = {
            secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
            expire: process.env.JWT_EXPIRE || '7d',
        };

        const defaultCorsOrigins = ['http://localhost:3000'];
        const envCorsOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);

        this.cors = {
            origins: envCorsOrigins.length > 0 ? envCorsOrigins : defaultCorsOrigins,
        };

        this.storage = {
            awsRegion: process.env.AWS_REGION || 'us-east-1',
            s3Bucket: process.env.AWS_S3_BUCKET || '',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            signedUrlTtlSeconds: Number(process.env.AWS_SIGNED_URL_TTL_SECONDS || 900),
            signedUrlRefreshMarginSeconds: 60,
        };

        if (this.app.nodeEnv === 'production' && !process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is required in production');
        }

        if (this.app.nodeEnv === 'production') {
            if (!this.storage.s3Bucket) {
                throw new Error('AWS_S3_BUCKET is required in production');
            }
            if (!this.storage.accessKeyId || !this.storage.secretAccessKey) {
                throw new Error('AWS credentials are required in production');
            }
        }

        AppConfig.instance = this;
    }

    async connectDatabase() {
        await mongoose.connect(this.database.url, {
            maxPoolSize: 20,
            minPoolSize: 5,
            socketTimeoutMS: 45000,
        });

        if (this.app.nodeEnv !== 'test') {
            console.log('MongoDB connected');
        }

        return true;
    }

    async disconnectDatabase() {
        await mongoose.disconnect();

        if (this.app.nodeEnv !== 'test') {
            console.log('MongoDB disconnected');
        }

        return true;
    }
}

export default new AppConfig();
