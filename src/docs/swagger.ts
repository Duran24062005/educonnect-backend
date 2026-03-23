import swaggerJsdoc from 'swagger-jsdoc';

const jsonContent = (schema: object) => ({
    'application/json': { schema },
});

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'EduConnect API',
            version: '2.0.0',
            description: 'API backend para gestión académica: usuarios, grupos, periodos, evaluaciones y reportes.',
        },
        servers: [{ url: '/' }],
        tags: [
            { name: 'System', description: 'Estado general del servicio' },
            { name: 'Auth', description: 'Autenticación y perfil' },
            { name: 'Users', description: 'Gestión de usuarios' },
            { name: 'Students', description: 'Operaciones específicas de estudiantes' },
            { name: 'Academic', description: 'Años escolares, periodos, grados, áreas y aulas' },
            { name: 'Groups', description: 'Grupos, matrículas y asignaciones' },
            { name: 'Evaluations', description: 'Ítems, notas y resultados' },
            { name: 'Analytics', description: 'Métricas por scope (student, teacher, admin)' },
            { name: 'Notifications', description: 'Notificaciones in-app y anuncios dirigidos' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                MessageResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Operación completada' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'fail' },
                        message: { type: 'string', example: 'Invalid request input' },
                        details: { type: 'array', items: { type: 'object' } },
                    },
                },
                AuthRegisterBody: {
                    type: 'object',
                    required: ['email', 'password', 'password_confirm'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 },
                        password_confirm: { type: 'string', minLength: 8 },
                    },
                },
                AuthLoginBody: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                    },
                },
                CompleteProfileBody: {
                    type: 'object',
                    required: ['first_name', 'last_name', 'document_type', 'document_number'],
                    properties: {
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        born_date: { type: 'string', example: '2006-01-15' },
                        document_type: { type: 'string', enum: ['CC', 'RC', 'CE'] },
                        document_number: { type: 'string' },
                        phone: { type: 'string' },
                        requested_role: { type: 'string', enum: ['Student', 'Teacher', 'Parent', 'Guardian'] },
                    },
                },
                NotificationItem: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        type: { type: 'string' },
                        title: { type: 'string' },
                        message: { type: 'string' },
                        audience_role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
                        is_read: { type: 'boolean' },
                        read_at: { type: 'string', nullable: true },
                        created_at: { type: 'string' },
                        source_type: { type: 'string', nullable: true },
                        source_id: { type: 'string', nullable: true },
                        metadata: { type: 'object' },
                    },
                },
                AdminAnnouncementBody: {
                    type: 'object',
                    required: ['title', 'message', 'target_role'],
                    properties: {
                        title: { type: 'string' },
                        message: { type: 'string' },
                        target_role: { type: 'string', enum: ['admin', 'teacher', 'student', 'teacher_student', 'teacher_admin', 'all'] },
                    },
                },
                TeacherAnnouncementBody: {
                    type: 'object',
                    required: ['title', 'message', 'scope'],
                    properties: {
                        title: { type: 'string' },
                        message: { type: 'string' },
                        scope: { type: 'string', enum: ['all_my_students', 'group'] },
                        group_id: { type: 'string', nullable: true },
                    },
                },
            },
            parameters: {
                ObjectIdParam: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                },
                SchoolYearIdParam: {
                    name: 'school_year_id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                },
                StudentIdParam: {
                    name: 'student_id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                },
                GroupIdParam: {
                    name: 'group_id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                },
                GradeIdParam: {
                    name: 'grade_id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                },
                GradeItemIdParam: {
                    name: 'grade_item_id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                },
            },
            responses: {
                Unauthorized: {
                    description: 'No autorizado',
                    content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }),
                },
                Forbidden: {
                    description: 'Acceso denegado',
                    content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }),
                },
                ValidationError: {
                    description: 'Error de validación',
                    content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }),
                },
            },
        },
        paths: {
            '/': {
                get: {
                    tags: ['System'],
                    summary: 'Información base de la API',
                    responses: { 200: { description: 'OK' } },
                },
            },
            '/health': {
                get: {
                    tags: ['System'],
                    summary: 'Health check',
                    responses: { 200: { description: 'Servicio saludable' } },
                },
            },

            '/api/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Registrar credenciales',
                    requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/AuthRegisterBody' }) },
                    responses: {
                        201: { description: 'Usuario registrado' },
                        400: { $ref: '#/components/responses/ValidationError' },
                    },
                },
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Iniciar sesión',
                    requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/AuthLoginBody' }) },
                    responses: {
                        200: { description: 'Login exitoso' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                    },
                },
            },
            '/api/auth/complete-profile': {
                post: {
                    tags: ['Auth'],
                    summary: 'Completar perfil personal',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/CompleteProfileBody' }) },
                    responses: {
                        200: { description: 'Perfil completado' },
                        401: { $ref: '#/components/responses/Unauthorized' },
                        400: { $ref: '#/components/responses/ValidationError' },
                    },
                },
            },
            '/api/auth/profile-status': {
                get: {
                    tags: ['Auth'],
                    summary: 'Consultar estado de completitud del perfil',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Estado del perfil' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Obtener usuario autenticado',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Datos del usuario' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Cerrar sesión (stateless)',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Logout exitoso' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/auth/change-password': {
                post: {
                    tags: ['Auth'],
                    summary: 'Cambiar contraseña',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['current_password', 'new_password', 'new_password_confirm'],
                            properties: {
                                current_password: { type: 'string' },
                                new_password: { type: 'string', minLength: 8 },
                                new_password_confirm: { type: 'string', minLength: 8 },
                            },
                        }),
                    },
                    responses: { 200: { description: 'Contraseña actualizada' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/notifications/me': {
                get: {
                    tags: ['Notifications'],
                    summary: 'Listar notificaciones del usuario autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'read', in: 'query', schema: { type: 'boolean' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
                    ],
                    responses: { 200: { description: 'Listado de notificaciones' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/notifications/me/unread-count': {
                get: {
                    tags: ['Notifications'],
                    summary: 'Contar notificaciones no leídas del usuario autenticado',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Conteo de no leídas' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/notifications/me/read-all': {
                patch: {
                    tags: ['Notifications'],
                    summary: 'Marcar todas las notificaciones propias como leídas',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Notificaciones actualizadas' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/notifications/{id}/read': {
                patch: {
                    tags: ['Notifications'],
                    summary: 'Marcar una notificación propia como leída',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Notificación actualizada' }, 401: { $ref: '#/components/responses/Unauthorized' } },
                },
            },
            '/api/notifications/admin/announcements': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Crear anuncio manual para un rol desde admin',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/AdminAnnouncementBody' }) },
                    responses: { 201: { description: 'Anuncio enviado' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/notifications/teacher/announcements': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Crear anuncio manual para estudiantes desde teacher',
                    security: [{ bearerAuth: [] }],
                    requestBody: { required: true, content: jsonContent({ $ref: '#/components/schemas/TeacherAnnouncementBody' }) },
                    responses: { 201: { description: 'Anuncio enviado' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },

            '/api/users': {
                get: {
                    tags: ['Users'],
                    summary: 'Listar usuarios (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
                        { name: 'role', in: 'query', schema: { type: 'string', enum: ['student', 'teacher', 'admin', 'parent', 'guardian'] } },
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'pending', 'inactive', 'blocked', 'egresado'] } },
                        { name: 'search', in: 'query', schema: { type: 'string' } },
                    ],
                    responses: { 200: { description: 'Listado de usuarios' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/users/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Obtener usuario por ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Usuario encontrado' } },
                },
                put: {
                    tags: ['Users'],
                    summary: 'Actualizar usuario',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            properties: {
                                first_name: { type: 'string' },
                                last_name: { type: 'string' },
                                birthdate: { type: 'string', format: 'date' },
                                born_date: { type: 'string', format: 'date' },
                                document_number: { type: 'string' },
                            },
                        }),
                    },
                    responses: { 200: { description: 'Usuario actualizado' } },
                },
                delete: {
                    tags: ['Users'],
                    summary: 'Eliminar usuario (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Usuario eliminado' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/users/{id}/approve': {
                post: {
                    tags: ['Users'],
                    summary: 'Aprobar usuario (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['role'],
                            properties: {
                                role: { type: 'string', enum: ['student', 'teacher', 'admin', 'parent', 'guardian'] },
                            },
                        }),
                    },
                    responses: { 200: { description: 'Usuario aprobado' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/users/{id}/status': {
                patch: {
                    tags: ['Users'],
                    summary: 'Cambiar estado de usuario (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['status'],
                            properties: { status: { type: 'string', enum: ['active', 'pending', 'inactive', 'blocked', 'egresado'] } },
                        }),
                    },
                    responses: { 200: { description: 'Estado actualizado' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/users/{id}/profile-photo': {
                patch: {
                    tags: ['Users'],
                    summary: 'Actualizar foto de perfil en AWS S3',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: { profile_photo: { type: 'string', format: 'binary' } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Foto actualizada y URL firmada sincronizada' } },
                },
            },
            '/api/users/role/{role}': {
                get: {
                    tags: ['Users'],
                    summary: 'Listar usuarios por rol (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'role', in: 'path', required: true, schema: { type: 'string', enum: ['student', 'teacher', 'admin', 'parent', 'guardian'] } },
                        { name: 'page', in: 'query', schema: { type: 'integer' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer' } },
                    ],
                    responses: { 200: { description: 'Listado por rol' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/users/admin/pending': {
                get: {
                    tags: ['Users'],
                    summary: 'Listar usuarios pendientes (Admin)',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Pendientes listados' } },
                },
            },
            '/api/users/admin/stats': {
                get: {
                    tags: ['Users'],
                    summary: 'Estadísticas de usuarios (Admin)',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Estadísticas' } },
                },
            },

            '/api/students/{id}/aula': {
                patch: {
                    tags: ['Students'],
                    summary: 'Asignar aula a estudiante (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['aula_id'],
                            properties: { aula_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        }),
                    },
                    responses: { 200: { description: 'Aula asignada' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },

            '/api/academic/school-years': {
                get: { tags: ['Academic'], summary: 'Listar años escolares', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Años escolares' } } },
                post: {
                    tags: ['Academic'],
                    summary: 'Crear año escolar (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['year', 'start_date', 'end_date'],
                            properties: {
                                year: { type: 'integer', minimum: 2000, maximum: 2100 },
                                start_date: { type: 'string', format: 'date' },
                                end_date: { type: 'string', format: 'date' },
                                is_active: { type: 'boolean' },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Año escolar creado' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/academic/school-years/active': { get: { tags: ['Academic'], summary: 'Obtener año escolar activo', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Año activo' } } } },
            '/api/academic/school-years/{id}/activate': {
                patch: {
                    tags: ['Academic'],
                    summary: 'Activar año escolar (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Año activado' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/academic/promotions': {
                post: {
                    tags: ['Academic'],
                    summary: 'Promoción masiva de estudiantes (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['from_school_year_id', 'to_school_year_id'],
                            properties: {
                                from_school_year_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                to_school_year_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                            },
                        }),
                    },
                    responses: { 200: { description: 'Promoción ejecutada' }, 403: { $ref: '#/components/responses/Forbidden' } },
                },
            },
            '/api/academic/school-years/{id}': {
                delete: {
                    tags: ['Academic'],
                    summary: 'Eliminar año escolar (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Año escolar eliminado' } },
                },
            },
            '/api/academic/school-years/{school_year_id}/periods': {
                get: {
                    tags: ['Academic'],
                    summary: 'Listar periodos por año escolar',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/SchoolYearIdParam' }],
                    responses: { 200: { description: 'Periodos listados' } },
                },
            },
            '/api/academic/periods': {
                post: {
                    tags: ['Academic'],
                    summary: 'Crear periodo (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['school_year_id', 'name', 'weight', 'start_date', 'end_date'],
                            properties: {
                                school_year_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                name: { type: 'string' },
                                weight: { type: 'number', minimum: 0, maximum: 1 },
                                start_date: { type: 'string', format: 'date' },
                                end_date: { type: 'string', format: 'date' },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Periodo creado' } },
                },
            },
            '/api/academic/periods/{id}': {
                delete: {
                    tags: ['Academic'],
                    summary: 'Eliminar periodo (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Periodo eliminado' } },
                },
            },
            '/api/academic/grades': {
                get: { tags: ['Academic'], summary: 'Listar grados', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Grados listados' } } },
                post: {
                    tags: ['Academic'],
                    summary: 'Crear grado (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['name'],
                            properties: { name: { type: 'string' }, level: { type: 'string' }, description: { type: 'string' } },
                        }),
                    },
                    responses: { 201: { description: 'Grado creado' } },
                },
            },
            '/api/academic/grades/{id}': {
                put: {
                    tags: ['Academic'],
                    summary: 'Actualizar grado (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Grado actualizado' } },
                },
                delete: {
                    tags: ['Academic'],
                    summary: 'Eliminar grado (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Grado eliminado' } },
                },
            },
            '/api/academic/areas': {
                get: { tags: ['Academic'], summary: 'Listar áreas', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Áreas listadas' } } },
                post: {
                    tags: ['Academic'],
                    summary: 'Crear área (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['name'],
                            properties: { name: { type: 'string' }, description: { type: 'string' } },
                        }),
                    },
                    responses: { 201: { description: 'Área creada' } },
                },
            },
            '/api/academic/areas/{id}': {
                put: {
                    tags: ['Academic'],
                    summary: 'Actualizar área (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Área actualizada' } },
                },
                delete: {
                    tags: ['Academic'],
                    summary: 'Eliminar área (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Área eliminada' } },
                },
            },
            '/api/academic/aulas': {
                get: { tags: ['Academic'], summary: 'Listar aulas', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Aulas listadas' } } },
                post: {
                    tags: ['Academic'],
                    summary: 'Crear aula (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['name', 'max_capacity'],
                            properties: { name: { type: 'string' }, max_capacity: { type: 'integer', minimum: 1 } },
                        }),
                    },
                    responses: { 201: { description: 'Aula creada' } },
                },
            },
            '/api/academic/aulas/{id}': {
                put: {
                    tags: ['Academic'],
                    summary: 'Actualizar aula (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Aula actualizada' } },
                },
                delete: {
                    tags: ['Academic'],
                    summary: 'Eliminar aula (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Aula eliminada' } },
                },
            },

            '/api/groups': {
                post: {
                    tags: ['Groups'],
                    summary: 'Crear grupo (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['name', 'grade_id', 'school_year_id', 'max_capacity'],
                            properties: {
                                name: { type: 'string' },
                                grade_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                school_year_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                max_capacity: { type: 'integer', minimum: 1 },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Grupo creado' } },
                },
            },
            '/api/groups/school-year/{school_year_id}': {
                get: {
                    tags: ['Groups'],
                    summary: 'Listar grupos por año escolar',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/SchoolYearIdParam' }],
                    responses: { 200: { description: 'Grupos listados' } },
                },
            },
            '/api/groups/{id}': {
                get: { tags: ['Groups'], summary: 'Obtener grupo por ID', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }], responses: { 200: { description: 'Grupo encontrado' } } },
                put: { tags: ['Groups'], summary: 'Actualizar grupo (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }], responses: { 200: { description: 'Grupo actualizado' } } },
                delete: { tags: ['Groups'], summary: 'Eliminar grupo (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }], responses: { 200: { description: 'Grupo eliminado' } } },
            },
            '/api/groups/enrollments': {
                post: {
                    tags: ['Groups'],
                    summary: 'Inscribir estudiante en grupo (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['student_id', 'group_id', 'school_year_id'],
                            properties: {
                                student_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                group_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                school_year_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Estudiante inscrito' } },
                },
            },
            '/api/groups/enrollments/transfer': {
                post: {
                    tags: ['Groups'],
                    summary: 'Trasladar matrícula de grupo (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['student_id', 'school_year_id', 'to_group_id'],
                            properties: {
                                student_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                school_year_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                to_group_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                reason: { type: 'string' },
                                observations: { type: 'string' },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Traslado realizado' } },
                },
            },
            '/api/groups/enrollments/{id}/status': {
                patch: {
                    tags: ['Groups'],
                    summary: 'Cambiar estado de matrícula (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['status'],
                            properties: { status: { type: 'string', enum: ['active', 'transferred', 'retired'] } },
                        }),
                    },
                    responses: { 200: { description: 'Estado de matrícula actualizado' } },
                },
            },
            '/api/groups/{group_id}/students': {
                get: {
                    tags: ['Groups'],
                    summary: 'Listar estudiantes de un grupo',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/GroupIdParam' }],
                    responses: { 200: { description: 'Estudiantes listados' } },
                },
            },
            '/api/groups/enrollments/student/{student_id}': {
                get: {
                    tags: ['Groups'],
                    summary: 'Listar matrículas por estudiante',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/StudentIdParam' }],
                    responses: { 200: { description: 'Matrículas listadas' } },
                },
            },
            '/api/groups/teachers/assign': {
                post: {
                    tags: ['Groups'],
                    summary: 'Asignar docente a grupo y área (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['teacher_id', 'group_id', 'area_id'],
                            properties: {
                                teacher_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                group_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                area_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Docente asignado' } },
                },
            },
            '/api/groups/{group_id}/teachers': {
                get: {
                    tags: ['Groups'],
                    summary: 'Listar docentes por grupo',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/GroupIdParam' }],
                    responses: { 200: { description: 'Docentes listados' } },
                },
            },
            '/api/groups/teachers/{teacher_id}/groups': {
                get: {
                    tags: ['Groups'],
                    summary: 'Listar grupos por docente',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'teacher_id', in: 'path', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }],
                    responses: { 200: { description: 'Grupos listados' } },
                },
            },
            '/api/groups/grade-areas': {
                post: {
                    tags: ['Groups'],
                    summary: 'Asignar área a grado (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['grade_id', 'area_id', 'weekly_hours'],
                            properties: {
                                grade_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                area_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                weekly_hours: { type: 'integer', minimum: 1 },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Área asignada al grado' } },
                },
            },
            '/api/groups/grade-areas/{grade_id}': {
                get: {
                    tags: ['Groups'],
                    summary: 'Listar áreas de un grado',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/GradeIdParam' }],
                    responses: { 200: { description: 'Áreas listadas' } },
                },
            },

            '/api/evaluations/grade-items': {
                get: {
                    tags: ['Evaluations'],
                    summary: 'Listar ítems por periodo y área',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'period_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'area_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Ítems listados' } },
                },
                post: {
                    tags: ['Evaluations'],
                    summary: 'Crear ítem de evaluación (Admin/Teacher)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['name', 'percentage', 'area_id', 'period_id'],
                            properties: {
                                name: { type: 'string' },
                                percentage: { type: 'number', minimum: 0, maximum: 100 },
                                area_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                period_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                            },
                        }),
                    },
                    responses: { 201: { description: 'Ítem creado' } },
                },
            },
            '/api/evaluations/grade-items/{id}': {
                put: {
                    tags: ['Evaluations'],
                    summary: 'Actualizar ítem de evaluación (Admin/Teacher)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Ítem actualizado' } },
                },
                delete: {
                    tags: ['Evaluations'],
                    summary: 'Eliminar ítem de evaluación (Admin/Teacher)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/ObjectIdParam' }],
                    responses: { 200: { description: 'Ítem eliminado' } },
                },
            },

            '/api/evaluations/scores': {
                post: {
                    tags: ['Evaluations'],
                    summary: 'Registrar calificación (Admin/Teacher)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['student_id', 'grade_item_id', 'score'],
                            properties: {
                                student_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                grade_item_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                score: { type: 'number', minimum: 0, maximum: 10 },
                            },
                        }),
                    },
                    responses: { 200: { description: 'Calificación registrada' } },
                },
            },
            '/api/evaluations/scores/student/{student_id}': {
                get: {
                    tags: ['Evaluations'],
                    summary: 'Listar calificaciones por estudiante',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/StudentIdParam' }],
                    responses: { 200: { description: 'Calificaciones del estudiante' } },
                },
            },
            '/api/evaluations/scores/grade-item/{grade_item_id}': {
                get: {
                    tags: ['Evaluations'],
                    summary: 'Listar calificaciones por ítem',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/GradeItemIdParam' }],
                    responses: { 200: { description: 'Calificaciones del ítem' } },
                },
            },
            '/api/evaluations/period-results/calculate': {
                post: {
                    tags: ['Evaluations'],
                    summary: 'Calcular resultado de periodo (Admin/Teacher)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['student_id', 'area_id', 'period_id'],
                            properties: {
                                student_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                area_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                period_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                            },
                        }),
                    },
                    responses: { 200: { description: 'Resultado de periodo calculado' } },
                },
            },
            '/api/evaluations/period-results/student/{student_id}': {
                get: {
                    tags: ['Evaluations'],
                    summary: 'Listar resultados por periodo de un estudiante',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/StudentIdParam' }],
                    responses: { 200: { description: 'Resultados de periodo listados' } },
                },
            },
            '/api/evaluations/final-results/calculate': {
                post: {
                    tags: ['Evaluations'],
                    summary: 'Calcular resultado final (Admin)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: jsonContent({
                            type: 'object',
                            required: ['student_id', 'school_year_id'],
                            properties: {
                                student_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                                school_year_id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
                            },
                        }),
                    },
                    responses: { 200: { description: 'Resultado final calculado' } },
                },
            },
            '/api/evaluations/final-results/school-year/{school_year_id}': {
                get: {
                    tags: ['Evaluations'],
                    summary: 'Listar resultados finales por año escolar (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { $ref: '#/components/parameters/SchoolYearIdParam' },
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['passed', 'failed', 'repeating'] } },
                    ],
                    responses: { 200: { description: 'Resultados finales listados' } },
                },
            },
            '/api/evaluations/final-results/student/{student_id}/year/{school_year_id}': {
                get: {
                    tags: ['Evaluations'],
                    summary: 'Obtener resultado final de estudiante por año',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { $ref: '#/components/parameters/StudentIdParam' },
                        { $ref: '#/components/parameters/SchoolYearIdParam' },
                    ],
                    responses: { 200: { description: 'Resultado final del estudiante' } },
                },
            },
            '/api/evaluations/stats/school-year/{school_year_id}': {
                get: {
                    tags: ['Evaluations'],
                    summary: 'Estadísticas de resultados por año escolar (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ $ref: '#/components/parameters/SchoolYearIdParam' }],
                    responses: { 200: { description: 'Estadísticas calculadas' } },
                },
            },

            '/api/analytics/student/me/overview': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Resumen anual del estudiante autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }],
                    responses: { 200: { description: 'Resumen del estudiante' } },
                },
            },
            '/api/analytics/student/me/areas': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Métricas por área del estudiante autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }],
                    responses: { 200: { description: 'Métricas por área' } },
                },
            },
            '/api/analytics/student/me/area-trend': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Evolución por periodo en un área (estudiante autenticado)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'area_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Tendencia por área' } },
                },
            },
            '/api/analytics/student/me/period-summary': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Resumen por periodo del estudiante autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }],
                    responses: { 200: { description: 'Resumen por periodo' } },
                },
            },
            '/api/analytics/teacher/me/groups': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Grupos donde dicta el docente autenticado',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }],
                    responses: { 200: { description: 'Grupos del docente' } },
                },
            },
            '/api/analytics/teacher/me/group-performance': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Rendimiento de grupo en área del docente',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'group_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'area_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'period_id', in: 'query', required: false, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Rendimiento del grupo' } },
                },
            },
            '/api/analytics/teacher/me/group-trend': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Tendencia por periodo del grupo en área del docente',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'group_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'area_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Tendencia del grupo' } },
                },
            },
            '/api/analytics/teacher/me/student-detail': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Detalle de un estudiante en área del docente',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'student_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'area_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Detalle del estudiante' } },
                },
            },
            '/api/analytics/admin/institution-overview': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Resumen institucional (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'period_id', in: 'query', required: false, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Resumen institucional' } },
                },
            },
            '/api/analytics/admin/institution-trend': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Tendencia institucional por periodo (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }],
                    responses: { 200: { description: 'Tendencia institucional' } },
                },
            },
            '/api/analytics/admin/by-grade': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Comparativa por grado (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'period_id', in: 'query', required: false, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Comparativa por grado' } },
                },
            },
            '/api/analytics/admin/by-area': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Comparativa por área (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'grade_id', in: 'query', required: false, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'period_id', in: 'query', required: false, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Comparativa por área' } },
                },
            },
            '/api/analytics/admin/grade-detail': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Detalle por grado (Admin)',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'school_year_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'grade_id', in: 'query', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                        { name: 'period_id', in: 'query', required: false, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
                    ],
                    responses: { 200: { description: 'Detalle del grado' } },
                },
            },
        },
    },
    apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
