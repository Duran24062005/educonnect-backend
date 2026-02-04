# EduConnect LMS - Planificación Backend

## Sistema de Gestión de Aprendizaje para Instituciones Educativas

**Stack Tecnológico Backend:**

- FastAPI (Framework principal)
- SQLAlchemy (ORM)
- PostgreSQL (Base de datos)
- JWT (Autenticación)
- Alembic (Migraciones)

---

## FASE 1: CONFIGURACIÓN INICIAL Y ARQUITECTURA BASE

**Duración estimada: 1-2 semanas**

### 1.1 Configuración del Proyecto

- [ ] Inicializar proyecto FastAPI
- [ ] Configurar estructura de directorios siguiendo arquitectura limpia:
  ```
  backend/
  ├── app/
  │   ├── api/
  │   │   ├── v1/
  │   │   │   ├── endpoints/
  │   │   │   └── deps.py
  │   │   └── router.py
  │   ├── core/
  │   │   ├── config.py
  │   │   ├── security.py
  │   │   └── logging.py
  │   ├── db/
  │   │   ├── base.py
  │   │   ├── session.py
  │   │   └── init_db.py
  │   ├── models/
  │   ├── schemas/
  │   ├── services/
  │   ├── repositories/
  │   └── utils/
  ├── alembic/
  ├── tests/
  ├── requirements.txt
  └── main.py
  ```
- [ ] Configurar variables de entorno (.env)
- [ ] Configurar Poetry o pip para gestión de dependencias
- [ ] Configurar pre-commit hooks (black, flake8, mypy)

### 1.2 Base de Datos

- [ ] Configurar conexión a PostgreSQL
- [ ] Configurar SQLAlchemy Base y Session
- [ ] Configurar Alembic para migraciones
- [ ] Crear script de inicialización de BD

### 1.3 Seguridad Base

- [ ] Implementar sistema de hash de contraseñas (bcrypt)
- [ ] Configurar JWT (access token y refresh token)
- [ ] Implementar middleware de CORS
- [ ] Configurar rate limiting básico

---

## FASE 2: SISTEMA DE AUTENTICACIÓN Y USUARIOS

**Duración estimada: 2 semanas**
**Requerimientos relacionados: R-01, R-02, RF01, RNF-05**

### 2.1 Modelos de Usuario

- [ ] Crear modelo base `User`:
  - id, email, hashed_password, is_active, created_at, updated_at
- [ ] Crear modelo `UserRole` (Enum: STUDENT, TEACHER, ADMIN)
- [ ] Crear modelo `Student` (extends User):
  - student_code, grade_level, section
- [ ] Crear modelo `Teacher` (extends User):
  - teacher_code, specialization
- [ ] Crear modelo `Administrator` (extends User):
  - admin_level, permissions

### 2.2 Schemas Pydantic

- [ ] UserCreate, UserUpdate, UserInDB, UserOut
- [ ] StudentCreate, StudentOut
- [ ] TeacherCreate, TeacherOut
- [ ] AdminCreate, AdminOut
- [ ] Token, TokenPayload

### 2.3 Endpoints de Autenticación

- [ ] POST `/api/v1/auth/register` - Registro de usuarios
- [ ] POST `/api/v1/auth/login` - Login (retorna access y refresh token)
- [ ] POST `/api/v1/auth/refresh` - Renovar access token
- [ ] POST `/api/v1/auth/logout` - Logout
- [ ] GET `/api/v1/auth/me` - Obtener usuario actual

### 2.4 Servicios y Repositorios

- [ ] UserRepository (CRUD operations)
- [ ] AuthService (login, register, verify token)
- [ ] Implementar dependency para obtener usuario actual
- [ ] Implementar dependency para verificar roles

---

## FASE 3: GESTIÓN DE AULAS VIRTUALES

**Duración estimada: 2-3 semanas**
**Requerimientos relacionados: R-03, RF02, RF14**

### 3.1 Modelos de Aulas

- [ ] Crear modelo `Classroom`:
  - id, name, description, classroom_type (SUBJECT, TEACHER_TRAINING, SPECIAL_NEEDS)
  - subject, grade_level, section
  - teacher_id, created_at, is_active
- [ ] Crear modelo `ClassroomEnrollment`:
  - id, classroom_id, user_id, role, enrolled_at
- [ ] Crear modelo `ClassroomSettings`:
  - classroom_id, allow_late_submissions, visible_grades, etc.

### 3.2 Schemas

- [ ] ClassroomCreate, ClassroomUpdate, ClassroomOut
- [ ] ClassroomEnrollmentCreate, ClassroomEnrollmentOut
- [ ] ClassroomWithStudents, ClassroomWithTeacher

### 3.3 Endpoints de Aulas

- [ ] POST `/api/v1/classrooms` - Crear aula (solo docentes/admin)
- [ ] GET `/api/v1/classrooms` - Listar aulas del usuario
- [ ] GET `/api/v1/classrooms/{id}` - Detalle de aula
- [ ] PUT `/api/v1/classrooms/{id}` - Actualizar aula
- [ ] DELETE `/api/v1/classrooms/{id}` - Eliminar/archivar aula
- [ ] POST `/api/v1/classrooms/{id}/enroll` - Inscribir estudiantes
- [ ] DELETE `/api/v1/classrooms/{id}/enroll/{user_id}` - Desinscribir
- [ ] GET `/api/v1/classrooms/{id}/students` - Listar estudiantes

### 3.4 Servicios

- [ ] ClassroomService (lógica de negocio)
- [ ] ClassroomRepository (acceso a datos)
- [ ] Validaciones de permisos por rol

---

## FASE 4: GESTIÓN DE CONTENIDOS Y MATERIALES

**Duración estimada: 2-3 semanas**
**Requerimientos relacionados: R-04, RF03, R-19, RF17**

### 4.1 Sistema de Archivos

- [ ] Configurar almacenamiento (local o S3/MinIO)
- [ ] Implementar servicio de upload de archivos
- [ ] Implementar validación de tipos de archivo
- [ ] Implementar generación de URLs firmadas

### 4.2 Modelos de Contenido

- [ ] Crear modelo `Material`:
  - id, classroom_id, title, description, material_type
  - (DOCUMENT, PRESENTATION, VIDEO, LINK, EXTERNAL_TOOL)
  - file_path/url, uploaded_by, created_at, order
- [ ] Crear modelo `MaterialFile`:
  - id, material_id, file_name, file_path, file_size, mime_type

### 4.3 Schemas

- [ ] MaterialCreate, MaterialUpdate, MaterialOut
- [ ] MaterialWithFiles
- [ ] FileUploadResponse

### 4.4 Endpoints de Materiales

- [ ] POST `/api/v1/classrooms/{id}/materials` - Subir material
- [ ] GET `/api/v1/classrooms/{id}/materials` - Listar materiales
- [ ] GET `/api/v1/materials/{id}` - Detalle de material
- [ ] PUT `/api/v1/materials/{id}` - Actualizar material
- [ ] DELETE `/api/v1/materials/{id}` - Eliminar material
- [ ] GET `/api/v1/materials/{id}/download` - Descargar archivo
- [ ] POST `/api/v1/materials/upload` - Endpoint de upload

### 4.5 Servicios

- [ ] MaterialService
- [ ] FileStorageService
- [ ] Implementar compresión de archivos grandes

---

## FASE 5: SISTEMA DE ACTIVIDADES Y TAREAS

**Duración estimada: 3 semanas**
**Requerimientos relacionados: R-06, RF05, R-15, RF15, R-20, RNF-04**

### 5.1 Modelos de Actividades

- [ ] Crear modelo `Activity`:
  - id, classroom_id, title, description, activity_type
  - (ASSIGNMENT, QUIZ, PROJECT, DISCUSSION)
  - due_date, points, allow_late, created_by
- [ ] Crear modelo `Submission`:
  - id, activity_id, student_id, submitted_at
  - file_path, status (PENDING, SUBMITTED, GRADED)
  - submission_hash (para detectar modificaciones)
- [ ] Crear modelo `SubmissionFile`:
  - id, submission_id, file_name, file_path, uploaded_at

### 5.2 Schemas

- [ ] ActivityCreate, ActivityUpdate, ActivityOut
- [ ] SubmissionCreate, SubmissionOut, SubmissionWithGrade
- [ ] ActivityWithSubmissions

### 5.3 Endpoints de Actividades

- [ ] POST `/api/v1/classrooms/{id}/activities` - Crear actividad
- [ ] GET `/api/v1/classrooms/{id}/activities` - Listar actividades
- [ ] GET `/api/v1/activities/{id}` - Detalle de actividad
- [ ] PUT `/api/v1/activities/{id}` - Actualizar actividad
- [ ] DELETE `/api/v1/activities/{id}` - Eliminar actividad
- [ ] POST `/api/v1/activities/{id}/submit` - Enviar tarea (estudiante)
- [ ] GET `/api/v1/activities/{id}/submissions` - Ver entregas (docente)
- [ ] GET `/api/v1/submissions/{id}` - Detalle de entrega

### 5.4 Servicios

- [ ] ActivityService
- [ ] SubmissionService
- [ ] Implementar validación de PDF obligatorio
- [ ] Implementar hash de archivos para prevenir edición
- [ ] Implementar notificaciones de entregas

---

## FASE 6: SISTEMA DE CALIFICACIONES Y RÚBRICAS

**Duración estimada: 2-3 semanas**
**Requerimientos relacionados: R-07, R-08, R-09, R-10, RF07, RF08, RF09, RF10**

### 6.1 Modelos de Evaluación

- [ ] Crear modelo `Rubric`:
  - id, name, description, total_points, created_by
- [ ] Crear modelo `RubricCriteria`:
  - id, rubric_id, criterion_name, max_points, description, order
- [ ] Crear modelo `Grade`:
  - id, submission_id, rubric_id, total_score, graded_by, graded_at
- [ ] Crear modelo `GradeDetail`:
  - id, grade_id, criteria_id, points_earned, feedback

### 6.2 Schemas

- [ ] RubricCreate, RubricUpdate, RubricOut
- [ ] GradeCreate, GradeUpdate, GradeOut
- [ ] GradeWithDetails, GradeBreakdown

### 6.3 Endpoints de Calificación

- [ ] POST `/api/v1/rubrics` - Crear rúbrica
- [ ] GET `/api/v1/rubrics` - Listar rúbricas
- [ ] GET `/api/v1/rubrics/{id}` - Detalle de rúbrica
- [ ] POST `/api/v1/submissions/{id}/grade` - Calificar entrega
- [ ] PUT `/api/v1/grades/{id}` - Actualizar calificación
- [ ] GET `/api/v1/grades/{id}` - Ver calificación detallada
- [ ] GET `/api/v1/students/{id}/grades` - Ver todas las notas del estudiante
- [ ] GET `/api/v1/activities/{id}/grades` - Ver todas las notas de una actividad

### 6.4 Servicios

- [ ] RubricService
- [ ] GradeService
- [ ] Implementar cálculo automático de promedios
- [ ] Implementar notificación inmediata al calificar

---

## FASE 7: HERRAMIENTAS COLABORATIVAS

**Duración estimada: 2-3 semanas**
**Requerimientos relacionados: R-05, RF04, R-11, RF11**

### 7.1 Modelos Colaborativos

- [ ] Crear modelo `Wiki`:
  - id, classroom_id, title, content, created_by, updated_at
- [ ] Crear modelo `WikiRevision`:
  - id, wiki_id, content, edited_by, edited_at
- [ ] Crear modelo `Forum`:
  - id, classroom_id, title, description, created_by
- [ ] Crear modelo `ForumPost`:
  - id, forum_id, user_id, content, parent_id, created_at
- [ ] Crear modelo `Blog`:
  - id, classroom_id, title, content, author_id, published_at
- [ ] Crear modelo `WorkGroup`:
  - id, classroom_id, name, created_by, max_members (default: 3)
- [ ] Crear modelo `WorkGroupMember`:
  - id, group_id, student_id, joined_at

### 7.2 Endpoints

**Wikis:**

- [ ] POST `/api/v1/classrooms/{id}/wikis`
- [ ] GET `/api/v1/classrooms/{id}/wikis`
- [ ] PUT `/api/v1/wikis/{id}`
- [ ] GET `/api/v1/wikis/{id}/history`

**Foros:**

- [ ] POST `/api/v1/classrooms/{id}/forums`
- [ ] GET `/api/v1/classrooms/{id}/forums`
- [ ] POST `/api/v1/forums/{id}/posts`
- [ ] GET `/api/v1/forums/{id}/posts`

**Blogs:**

- [ ] POST `/api/v1/classrooms/{id}/blogs`
- [ ] GET `/api/v1/classrooms/{id}/blogs`
- [ ] PUT `/api/v1/blogs/{id}`

**Grupos de Trabajo:**

- [ ] POST `/api/v1/classrooms/{id}/workgroups`
- [ ] GET `/api/v1/classrooms/{id}/workgroups`
- [ ] POST `/api/v1/workgroups/{id}/members`
- [ ] DELETE `/api/v1/workgroups/{id}/members/{student_id}`

### 7.3 Servicios

- [ ] WikiService
- [ ] ForumService
- [ ] BlogService
- [ ] WorkGroupService

---

## FASE 8: SISTEMA DE MENSAJERÍA

**Duración estimada: 1-2 semanas**
**Requerimientos relacionados: R-16, RF13, R-23**

### 8.1 Modelos de Mensajería

- [ ] Crear modelo `Message`:
  - id, sender_id, recipient_id, subject, content
  - read, read_at, sent_at
- [ ] Crear modelo `MessageThread`:
  - id, participants, last_message_id
- [ ] Crear modelo `Notification`:
  - id, user_id, notification_type, content, read, created_at

### 8.2 Endpoints

- [ ] POST `/api/v1/messages` - Enviar mensaje
- [ ] GET `/api/v1/messages/inbox` - Bandeja de entrada
- [ ] GET `/api/v1/messages/sent` - Mensajes enviados
- [ ] GET `/api/v1/messages/{id}` - Ver mensaje
- [ ] PUT `/api/v1/messages/{id}/read` - Marcar como leído
- [ ] GET `/api/v1/notifications` - Obtener notificaciones
- [ ] PUT `/api/v1/notifications/{id}/read` - Marcar notificación

### 8.3 Servicios

- [ ] MessageService
- [ ] NotificationService
- [ ] Implementar sistema de recordatorios automáticos
- [ ] Implementar WebSocket para mensajes en tiempo real (opcional)

---

## FASE 9: SISTEMA DE TRAZABILIDAD Y LOGS

**Duración estimada: 2 semanas**
**Requerimientos relacionados: R-12, RF12, R-22, RNF-07**

### 9.1 Modelos de Auditoría

- [ ] Crear modelo `UserActivity`:
  - id, user_id, activity_type, resource_type, resource_id
  - action, ip_address, user_agent, created_at
- [ ] Crear modelo `SessionLog`:
  - id, user_id, login_at, logout_at, duration, ip_address
- [ ] Crear modelo `ContentAccessLog`:
  - id, user_id, material_id, accessed_at, duration

### 9.2 Endpoints de Administración

- [ ] GET `/api/v1/admin/logs/users` - Logs de usuarios
- [ ] GET `/api/v1/admin/logs/sessions` - Logs de sesiones
- [ ] GET `/api/v1/admin/logs/content-access` - Acceso a contenidos
- [ ] GET `/api/v1/admin/analytics/user/{id}` - Analítica de usuario
- [ ] GET `/api/v1/admin/analytics/classroom/{id}` - Analítica de aula
- [ ] GET `/api/v1/users/{id}/activity-report` - Reporte de actividad

### 9.3 Servicios

- [ ] ActivityLogService
- [ ] AnalyticsService
- [ ] Implementar middleware de logging automático
- [ ] Implementar dashboard de estadísticas

---

## FASE 10: INTEGRACIÓN DE HERRAMIENTAS EXTERNAS

**Duración estimada: 1-2 semanas**
**Requerimientos relacionados: R-18, RF16**

### 10.1 Modelos

- [ ] Crear modelo `ExternalTool`:
  - id, name, tool_type, url, api_key, config_json
- [ ] Crear modelo `ExternalActivity`:
  - id, classroom_id, tool_id, activity_data, created_by

### 10.2 Endpoints

- [ ] POST `/api/v1/external-tools` - Registrar herramienta
- [ ] GET `/api/v1/external-tools` - Listar herramientas
- [ ] POST `/api/v1/classrooms/{id}/external-activities` - Crear actividad externa
- [ ] GET `/api/v1/external-activities/{id}` - Obtener actividad

### 10.3 Servicios

- [ ] ExternalToolService
- [ ] Implementar conectores para herramientas comunes (Genially, Educaplay, etc.)

---

## FASE 11: OPTIMIZACIÓN Y PERFORMANCE

**Duración estimada: 1-2 semanas**
**Requerimientos relacionados: RNF-08, RNF-09**

### 11.1 Tareas de Optimización

- [ ] Implementar paginación en todos los listados
- [ ] Implementar caché con Redis para consultas frecuentes
- [ ] Optimizar queries con SQLAlchemy (eager loading)
- [ ] Implementar índices en base de datos
- [ ] Implementar compresión de respuestas HTTP
- [ ] Configurar CDN para archivos estáticos
- [ ] Implementar lazy loading de relaciones

### 11.2 Monitoreo

- [ ] Implementar health check endpoint
- [ ] Configurar logging estructurado
- [ ] Implementar métricas con Prometheus (opcional)
- [ ] Configurar alertas de performance

---

## FASE 12: TESTING Y DOCUMENTACIÓN

**Duración estimada: 2-3 semanas**

### 12.1 Testing

- [ ] Tests unitarios de servicios (pytest)
- [ ] Tests de integración de endpoints
- [ ] Tests de autenticación y autorización
- [ ] Tests de carga con locust
- [ ] Configurar CI/CD pipeline

### 12.2 Documentación

- [ ] Documentación automática con OpenAPI/Swagger
- [ ] Documentar variables de entorno
- [ ] Crear README con instrucciones de instalación
- [ ] Documentar arquitectura y decisiones técnicas
- [ ] Crear guía de deployment

---

## FASE 13: DEPLOYMENT Y PRODUCCIÓN

**Duración estimada: 1 semana**
**Requerimientos relacionados: RNF-06**

### 13.1 Preparación

- [ ] Configurar Docker y Docker Compose
- [ ] Crear Dockerfile optimizado
- [ ] Configurar nginx como reverse proxy
- [ ] Configurar SSL/TLS
- [ ] Configurar backups automáticos de BD

### 13.2 Deployment

- [ ] Deploy en servidor (AWS, DigitalOcean, etc.)
- [ ] Configurar dominio y DNS
- [ ] Configurar monitoreo de uptime
- [ ] Configurar logs centralizados

---

## DEPENDENCIAS Y LIBRERÍAS PRINCIPALES

```txt
# Core
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Validation
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0

# File handling
python-magic==0.4.27
aiofiles==23.2.1

# Utils
python-dotenv==1.0.0
python-slugify==8.0.1

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0

# Optional
redis==5.0.1
celery==5.3.4
boto3==1.34.34  # Si usas S3
```

---

## CRONOGRAMA ESTIMADO TOTAL: 20-28 SEMANAS (5-7 MESES)

### Hitos Principales:

1. **Mes 1-2**: Sistema de usuarios y autenticación completo
2. **Mes 2-3**: Aulas virtuales y gestión de contenidos
3. **Mes 3-4**: Sistema de actividades y calificaciones
4. **Mes 4-5**: Herramientas colaborativas y mensajería
5. **Mes 5-6**: Logs, analytics y optimización
6. **Mes 6-7**: Testing, documentación y deployment

---

## PRIORIZACIÓN DE FEATURES (MoSCoW)

### MUST HAVE (Lanzamiento MVP)

- Autenticación y roles
- Creación de aulas
- Subida de materiales
- Creación y entrega de tareas
- Sistema básico de calificaciones
- Mensajería básica

### SHOULD HAVE (Versión 1.0)

- Rúbricas detalladas
- Wikis y foros
- Grupos de trabajo
- Sistema completo de logs
- Notificaciones automáticas

### COULD HAVE (Versión 1.1+)

- Integración con herramientas externas
- Analytics avanzados
- WebSockets para tiempo real
- Sistema de badges/gamificación

### WON'T HAVE (Futuro)

- Videoconferencias integradas
- Sistema de pago
- Aplicación móvil nativa

---

## CONSIDERACIONES ESPECIALES PARA COLOMBIA

### Cumplimiento Legal

- [ ] Implementar Habeas Data según Ley 1581 de 2012
- [ ] Política de tratamiento de datos personales
- [ ] Consentimiento informado para menores

### Localización

- [ ] Configurar timezone para Colombia (America/Bogota)
- [ ] Formato de fechas en español
- [ ] Validación de documentos colombianos (TI, CC)

---

## PRÓXIMOS PASOS

1. **Revisar y aprobar esta planificación**
2. **Comenzar con Fase 1**: Configuración inicial
3. **Definir sprints semanales** según metodología ágil elegida
4. **Establecer métricas de éxito** para cada fase

¿Deseas que profundice en alguna fase específica o que comencemos con el código de la Fase 1?
