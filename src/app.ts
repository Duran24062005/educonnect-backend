import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

import appConfig from './config/config.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { swaggerSpec } from './docs/swagger.js';

import authRouter from './routes/auth/auth.routes.js';
import usersRouter from './routes/users.routes.js';
import studentsRouter from './routes/students.routes.js';
import guardiansRouter from './routes/guardians.routes.js';
import academicRouter from './routes/academic.routes.js';
import groupsRouter from './routes/groups.routes.js';
import evaluationsRouter from './routes/evaluations.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import activitiesRouter from './routes/activities.routes.js';
import notificationsRouter from './routes/notifications.routes.js';
import institutionsRouter from './routes/institutions.routes.js';
import auditLogsRouter from './routes/audit-logs.routes.js';
import calendarRouter from './routes/calendar.routes.js';
import attendanceRouter from './routes/attendance.routes.js';
import importRouter from './routes/import.routes.js';
import { runTenantRequest } from './tenant/tenant-context.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));
app.use((_req, _res, next) => runTenantRequest(next));

// Headers de seguridad (H6). La CSP se desactiva para no romper Swagger UI (/api-docs),
// conservando X-Frame-Options, nosniff, HSTS y referrer-policy.
app.use(helmet({ contentSecurityPolicy: false }));

// Límite global de solicitudes por IP (H5). Desactivado en test.
app.use('/api', globalLimiter);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (appConfig.cors.origins.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'EduConnect API',
        environment: appConfig.app.nodeEnv,
        docs: '/api-docs',
    });
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (_req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;

    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'ready' : 'not_ready',
        checks: {
            database: databaseReady ? 'up' : 'down',
        },
        timestamp: new Date().toISOString(),
    });
});

const swaggerHtml = swaggerUi
    .generateHTML(swaggerSpec)
    .replace(/(href|src)="\.\/([^" ]+)"/g, '$1="/api-docs/$2"');
const swaggerUiHandler = (_req: express.Request, res: express.Response) => {
    res.type('html').send(swaggerHtml);
};
app.get(['/api-docs', '/api-docs/'], swaggerUiHandler);
app.use('/api-docs', swaggerUi.serve);

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/guardians', guardiansRouter);
app.use('/api/academic', academicRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/institutions', institutionsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/imports', importRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
