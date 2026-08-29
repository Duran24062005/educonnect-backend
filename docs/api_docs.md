# API Docs - Estado Actual

## Swagger/OpenAPI

La documentación viva de la API está disponible en:

- `GET /api-docs`

Generada desde `src/docs/swagger.js`.

## Endpoints principales

### Sistema

- `GET /` Información general API.
- `GET /health` Health check.
- `GET /health/ready` Readiness check que confirma conexión con MongoDB.

### Autenticación

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/verify-password-reset-code`
- `POST /api/auth/reset-password`
- `POST /api/auth/complete-profile` (token requerido, perfil incompleto permitido)
- `GET /api/auth/profile-status` (token requerido)
- `GET /api/auth/me` (protegido)
- `POST /api/auth/logout` (protegido)
- `POST /api/auth/change-password` (protegido)

La recuperación responde de forma genérica para no revelar si un correo existe. Usa un código de 6 dígitos con vigencia de 10 minutos y máximo 5 intentos. La plantilla externa `reset_password.html` debe mostrar `template_data.codigo`. La plantilla fuente está en [`templates/reset_password.html`](../templates/reset_password.html) y usa `{{nombre}}`, `{{codigo}}` y `{{empresa}}`.

### Instituciones y piloto

- `POST /api/institutions` (Admin, crea el sandbox institucional)
- `GET /api/institutions/current` (protegido)
- `GET /api/institutions/current/schedule-config` (protegido; días lectivos y zona horaria)
- `PATCH /api/institutions/current/schedule-config` (Admin; actualiza días lectivos)

Las jornadas institucionales incluyen `shift_type` (`morning`, `afternoon` o `hybrid`) además de nombre, código y rango horario. Los registros anteriores sin este campo se leen como `morning`.
- `PATCH /api/institutions/current/users/:user_id` (Admin)

### Auditoría

- `GET /api/audit-logs` (Admin con institución asignada)

### Calendario

- `GET /api/calendar/catalog` (protegido, opciones visibles por rol)
- `GET /api/calendar` (Admin, rango y filtros por grado, grupo, materia, docente y aula)
- `GET /api/calendar/me` (Docente o estudiante, alcance por asignación o matrícula)
- `POST /api/calendar/sessions` (Admin o docente asignado)
- `POST /api/calendar/exceptions` (Admin; requiere motivo y representa una excepción fuera de la disponibilidad)
- `PATCH /api/calendar/sessions/:id` (Admin o docente autorizado; editar, cancelar o reactivar)
- `GET /api/calendar/schedules` (Admin; horarios por año y estado)
- `GET /api/calendar/schedules/me` (Docente; bloques publicados asignados al docente)
- `POST /api/calendar/schedules/drafts` (Admin)
- `PATCH /api/calendar/schedules/:id` (Admin; días, ventanas compatibles y slots exactos por grupo/materia/día/hora)
- `POST /api/calendar/schedules/:id/publish` (Admin)

### Materiales educativos

- `GET /api/materials/teacher/me` (Teacher; filtros por grupo, materia y sesión)
- `GET /api/materials/teacher/me/sessions` (Teacher)
- `POST /api/materials/teacher/me` (Teacher; `multipart/form-data`, archivo en `material_file` o `link_url`)
- `PUT /api/materials/teacher/me/:material_id` (Teacher; metadatos, sesión, tema y recurso)
- `DELETE /api/materials/teacher/me/:material_id` (Teacher)
- `GET /api/materials/student/me` (Student; alcance por matrícula activa)
- `GET /api/materials/student/me/:material_id` (Student)

Los archivos aceptan cualquier MIME type hasta el límite definido por `MATERIAL_FILE_SIZE_LIMIT_MB` (50 MB por defecto) y se sirven desde storage privado mediante URLs firmadas. Los materiales se mantienen visibles aunque la sesión esté cancelada.

Los horarios aceptan `slots` con `slot_id`, `group_id`, `area_id`, `teacher_id`, `aula_id`, `weekday`, `start_time` y `end_time`. Cuando un horario publicado contiene slots, una sesión calendarizada debe coincidir con el grupo, materia, docente, día y rango de uno de ellos. Los horarios históricos que solo tienen `availability_windows` conservan su comportamiento anterior.

### Usuarios

- `GET /api/users` (Admin)
- `GET /api/users/role/:role` (Admin)
- `GET /api/users/admin/pending` (Admin)
- `GET /api/users/admin/stats` (Admin)
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/profile-photo`
- `POST /api/users/:id/approve` (Admin)
- `PATCH /api/users/:id/status` (Admin)
- `DELETE /api/users/:id` (Admin)
- `GET /api/users/:id/sessions` (Admin)
- `DELETE /api/users/:id/sessions/:jti` (Admin)

### Académico

- `GET|POST /api/academic/school-years`
- `GET /api/academic/school-years/active`
- `PATCH /api/academic/school-years/:id/activate` (Admin)
- `DELETE /api/academic/school-years/:id` (Admin)
- `POST /api/academic/promotions` (Admin)
- `GET /api/academic/school-years/:school_year_id/periods`
- `POST /api/academic/periods` (Admin)
- `DELETE /api/academic/periods/:id` (Admin)
- `GET|POST|PUT|DELETE /api/academic/grades` (Admin en mutaciones)
- `GET|POST|PUT|DELETE /api/academic/areas` (Admin en mutaciones)
- `GET|POST|PUT|DELETE /api/academic/aulas` (Admin en mutaciones)

### Grupos

- `GET /api/groups/school-year/:school_year_id`
- `POST /api/groups` (Admin)
- `GET|PUT|DELETE /api/groups/:id` (Admin en mutaciones)
- `GET /api/groups/:group_id/detail-summary` (Admin)
- `POST /api/groups/enrollments` (Admin)
- `POST /api/groups/enrollments/transfer` (Admin)
- `PATCH /api/groups/enrollments/:id/status` (Admin)
- `GET /api/groups/:group_id/students`
- `GET /api/groups/enrollments/student/:student_id`
- `POST /api/groups/teachers/assign` (Admin)
- `GET /api/groups/:group_id/teachers`
- `GET /api/groups/teachers/:teacher_id/groups`
- `POST /api/groups/grade-areas` (Admin)
- `GET /api/groups/grade-areas/:grade_id`

### Evaluaciones

- `GET|POST|PUT|DELETE /api/evaluations/grade-items` (Admin/Teacher en mutaciones)
- `POST /api/evaluations/scores` (Admin/Teacher)
- `GET /api/evaluations/scores/student/:student_id`
- `GET /api/evaluations/scores/grade-item/:grade_item_id`
- `POST /api/evaluations/period-results/calculate` (Admin/Teacher)
- `GET /api/evaluations/period-results/student/:student_id`
- `POST /api/evaluations/final-results/calculate` (Admin)
- `GET /api/evaluations/final-results/school-year/:school_year_id` (Admin)
- `GET /api/evaluations/final-results/student/:student_id/year/:school_year_id`
- `GET /api/evaluations/stats/school-year/:school_year_id` (Admin)

### Analytics

- `GET /api/analytics/student/me/overview` (Student)
- `GET /api/analytics/student/me/areas` (Student)
- `GET /api/analytics/student/me/area-trend` (Student)
- `GET /api/analytics/student/me/period-summary` (Student)
- `GET /api/analytics/teacher/me/groups` (Teacher)
- `GET /api/analytics/teacher/me/dashboard-summary` (Teacher)
- `GET /api/analytics/teacher/me/group-performance` (Teacher)
- `GET /api/analytics/teacher/me/group-trend` (Teacher)
- `GET /api/analytics/teacher/me/student-detail` (Teacher)
- `GET /api/analytics/admin/dashboard-summary` (Admin)
- `GET /api/analytics/admin/institution-overview` (Admin)
- `GET /api/analytics/admin/institution-trend` (Admin)
- `GET /api/analytics/admin/by-grade` (Admin)
- `GET /api/analytics/admin/by-area` (Admin)
- `GET /api/analytics/admin/grade-detail` (Admin)

## Endpoints agregados de rendimiento

Para reducir requests por pantalla, el backend ahora expone respuestas agregadas listas para UI:

- `GET /api/analytics/admin/dashboard-summary`
  - combina stats de usuarios, pendientes y resumen institucional del anio escolar
- `GET /api/analytics/teacher/me/dashboard-summary`
  - combina asignaciones del docente, metricas por grupo-area y tendencia por periodo
- `GET /api/groups/:group_id/detail-summary`
  - combina grupo, matriculas activas, docentes asignados, areas del grado y opciones de docentes

Estos endpoints no reemplazan los anteriores; conviven para compatibilidad y deben preferirse en dashboards o pantallas de detalle pesadas.

## Validación y errores

- Todas las rutas relevantes validan `body/params/query` con Zod.
- Formato de error estándar:

```json
{
  "status": "fail",
  "message": "Invalid request input",
  "details": []
}
```
