import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'EduConnect API',
            version: '1.0.0',
            description: 'Backend API for academic management in EduConnect.',
        },
        servers: [{ url: '/'}],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'fail' },
                        message: { type: 'string', example: 'Invalid request input' },
                        details: { type: 'array', items: { type: 'object' } },
                    },
                },
            },
        },
        paths: {
            '/api/auth/register': {
                post: {
                    summary: 'Register user credentials',
                    tags: ['Auth'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password', 'password_confirm'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string', minLength: 8 },
                                        password_confirm: { type: 'string', minLength: 8 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'User registered' },
                        400: { description: 'Validation error' },
                    },
                },
            },
            '/api/auth/login': {
                post: {
                    summary: 'Authenticate user',
                    tags: ['Auth'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Login success' },
                        401: { description: 'Invalid credentials' },
                    },
                },
            },
            '/api/students/{id}/aula': {
                patch: {
                    summary: 'Assign classroom to student',
                    tags: ['Students'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['aula_id'],
                                    properties: {
                                        aula_id: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Assigned successfully' },
                        403: { description: 'Forbidden' },
                    },
                },
            },
            '/api/users': {
                get: {
                    summary: 'List users',
                    tags: ['Users'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer' } },
                        { name: 'role', in: 'query', schema: { type: 'string' } },
                        { name: 'status', in: 'query', schema: { type: 'string' } },
                    ],
                    responses: {
                        200: { description: 'Users listed' },
                        403: { description: 'Forbidden' },
                    },
                },
            },
            '/health': {
                get: {
                    summary: 'Health check',
                    tags: ['System'],
                    responses: { 200: { description: 'Healthy' } },
                },
            },
        },
    },
    apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
