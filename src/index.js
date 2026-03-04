import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';


import appConfig from './config/config.js';

import auth_router from './routes/auth/auth.routes.js';
import users_router from './routes/users.routes.js';
import academic_router from './routes/academic.routes.js';
import groups_router from './routes/groups.routes.js';
import evaluations_router from './routes/evaluations.routes.js';
import { errorHandler } from './utils/error.js';

const app = express();
const port = appConfig.app.port;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('port', port);
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

app.use(
    cors({
        origin: (origin, callback) => {
            // Permite requests server-to-server o herramientas sin header Origin
            if (!origin) {
                return callback(null, true);
            }

            if (appConfig.cors.origins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS bloqueado para el origen: ${origin}`));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// ===== INFO =====
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'EduConnect API v2',
        version: '2.0.0',
        environment: appConfig.app.nodeEnv,
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                completeProfile: 'POST /api/auth/complete-profile (token requerido)',
                profileStatus: 'GET /api/auth/profile-status (token requerido)',
                me: 'GET /api/auth/me (protegido)',
                logout: 'POST /api/auth/logout (protegido)',
                changePassword: 'POST /api/auth/change-password (protegido)',
            },
            users: {
                getAll: 'GET /api/users (admin)',
                getById: 'GET /api/users/:id',
                update: 'PUT /api/users/:id',
                uploadProfilePhoto: 'PATCH /api/users/:id/profile-photo',
                pending: 'GET /api/users/admin/pending (admin)',
                approve: 'POST /api/users/:id/approve (admin)',
                status: 'PATCH /api/users/:id/status (admin)',
                delete: 'DELETE /api/users/:id (admin)',
                stats: 'GET /api/users/admin/stats (admin)',
            },
            academic: {
                schoolYears: 'GET|POST /api/academic/school-years',
                activeYear: 'GET /api/academic/school-years/active',
                periods: 'GET|POST /api/academic/periods',
                grades: 'GET|POST|PUT|DELETE /api/academic/grades',
                areas: 'GET|POST|PUT|DELETE /api/academic/areas',
                aulas: 'GET|POST|PUT|DELETE /api/academic/aulas',
            },
            groups: {
                groups: 'GET|POST|PUT|DELETE /api/groups',
                enrollments: 'POST /api/groups/enrollments',
                teacherAssignment: 'POST /api/groups/teachers/assign',
                gradeAreas: 'POST|GET /api/groups/grade-areas',
            },
            evaluations: {
                gradeItems: 'GET|POST|PUT|DELETE /api/evaluations/grade-items',
                scores: 'POST|GET /api/evaluations/scores',
                periodResults: 'POST|GET /api/evaluations/period-results',
                finalResults: 'POST|GET /api/evaluations/final-results',
                stats: 'GET /api/evaluations/stats/school-year/:id',
            },
            images: {
                uploads: "GET /uploads/file_name.extension",
                profilesPhotos: "GET /uploads/profiles/file_name.extension"
            },
        },
    });
});

// Images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== HEALTH =====
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== RUTAS =====
app.use('/api/auth', auth_router);
app.use('/api/users', users_router);
app.use('/api/academic', academic_router);
app.use('/api/groups', groups_router);
app.use('/api/evaluations', evaluations_router);

// 404
app.all(/.*/, (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Ruta ${req.originalUrl} no encontrada`,
    });
});

app.use(errorHandler);

async function startServer() {
    try {
        await appConfig.connectDatabase();
        app.listen(port, () => {
            console.log(`✅ Servidor corriendo en puerto ${app.get('port')}`);
            console.log(`🌐 http://localhost:${app.get('port')}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();

export default app;
