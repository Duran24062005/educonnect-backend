import express from 'express';
import cors from 'cors';

import app_config from './config/config.js';

import users_router from './routes/users.routes.js';
import auth_router from './routes/auth/auth.routes.js';
import { errorHandler } from './utils/error.js';
import { generateToken, verifyToken } from './utils/jwt.js';

const app = express();
const port = app_config.app.port;

// Configuración
app.set('port', port);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
    cors({
        origin: app_config.cors.origin,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// Ruta de inicio
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'EduConnect API v1',
        version: '1.0.0',
        environment: app_config.app.nodeEnv,
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout (protegido)',
                me: 'GET /api/auth/me (protegido)',
                changePassword: 'POST /api/auth/change-password (protegido)',
            },
            users: {
                getAll: 'GET /api/users (protegido - admin)',
                getById: 'GET /api/users/:id (protegido)',
                update: 'PUT /api/users/:id (protegido)',
                getPending: 'GET /api/users/pending (protegido - admin)',
                approve: 'POST /api/users/:id/approve (protegido - admin)',
                delete: 'DELETE /api/users/:id (protegido - admin)',
                changeStatus: 'PATCH /api/users/:id/status (protegido - admin)',
            },
        },
    });
});

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Code TEST
// const token = generateToken(2, 'admin')
// console.log(token);
// const decodeToken = verifyToken(token);
// console.log(decodeToken);
// console.log(app_config.app.nodeEnv);


// Rutas
app.use('/api/auth', auth_router);
app.use('/api/users', users_router);

// Ruta 404
app.all(/.*/, (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Ruta ${req.originalUrl} no encontrada`,
    });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
async function startServer() {
    try {
        // Conectar a MongoDB
        await app_config.connectDatabase();

        app.listen(port, () => {
            console.log(`✅ Servidor corriendo en puerto ${app.get('port')}`);
            console.log(`🌐 http://localhost:${app.get('port')}`);
            console.log(`📚 Documentación: http://localhost:${app.get('port')}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();

export default app;