import express from 'express';
import cors from 'cors';

import app_config from './config/config.js';

import users_router from './routes/users.routes.js';
import auth_router from './routes/auth/auth.routes.js';
import { errorHandler } from './utils/error.js';

const app = express()
const port = app_config.app.port


// Configuración
app.set('port', port);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Habilitar CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Ruta de inicio
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'EduConnect API v1',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: "/api/auth/register",
                login: '/api/auth/login',
                authentication: "/api/auth/authentication"
            },
            users: '/api/users',
        }
    });
});

app.use('/api/auth', auth_router)
app.use('/api/users', users_router)

// Ruta 404
app.all(/.*/, (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Route ${req.originalUrl} not found`
    });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(port, () => {
    console.log(`✅ Server running on port ${app.get('port')}`);
    console.log(`🌐 http://localhost:${app.get('port')}!`);
});