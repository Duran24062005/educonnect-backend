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

import { apiModules } from './modules/index.js';
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

for (const apiModule of apiModules) {
    app.use(apiModule.basePath, apiModule.router);
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
