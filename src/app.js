import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

import appConfig from './config/config.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { swaggerSpec } from './docs/swagger.js';

import authRouter from './routes/auth/auth.routes.js';
import usersRouter from './routes/users.routes.js';
import studentsRouter from './routes/students.routes.js';
import academicRouter from './routes/academic.routes.js';
import groupsRouter from './routes/groups.routes.js';
import evaluationsRouter from './routes/evaluations.routes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/academic', academicRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/evaluations', evaluationsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
