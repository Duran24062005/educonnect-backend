import 'dotenv/config';
import mongoose from 'mongoose';

class AppConfig {
    static instance;

    constructor() {
        if (AppConfig.instance) {
            return AppConfig.instance;
        }

        this.app = {
            name: 'EduConnect Backend',
            description: 'Backend para el sistema LMS EduConnect',
            port: process.env.PORT || 8000,
            nodeEnv: process.env.NODE_ENV || 'development',
            emailApiBase: process.nextTick.EMAIL_API_BASE_URL || 'http://localhost:8000/'
        };

        this.database = {
            mongoUri: process.env.MONGO_URI_CLOUD || 'mongodb://admin:admin123@localhost:27017/educonnect?authSource=admin',
            mongoUsername: process.env.MONGO_USERNAME || 'admin',
            mongoPassword: process.env.MONGO_PASSWORD || 'admin123',
        };

        this.jwt = {
            secret: process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion',
            expire: process.env.JWT_EXPIRE || '7d',
        };

        this.cors = {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        };

        AppConfig.instance = this;
    }

    /**
     * Conectar a MongoDB
     */
    async connectDatabase() {
        try {
            const uri = this.database.mongoUri;
            const options = {
                maxPoolSize: 10,
                socketTimeoutMS: 45000,
            };

            await mongoose.connect(uri, options);

            console.log('✅ MongoDB conectado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al conectar a MongoDB:', error.message);
            throw error;
        }
    }

    /**
     * Desconectar de MongoDB
     */
    async disconnectDatabase() {
        try {
            await mongoose.disconnect();
            console.log('✅ MongoDB desconectado');
            return true;
        } catch (error) {
            console.error('❌ Error al desconectar de MongoDB:', error.message);
            throw error;
        }
    }
}

export default new AppConfig();