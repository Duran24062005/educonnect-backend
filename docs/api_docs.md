# API Docs - Estado Actual

## Swagger/OpenAPI

La documentación viva de la API está disponible en:

- `GET /api-docs`

Generada desde `src/docs/swagger.js`.

## Endpoints principales

### Sistema

- `GET /` Información general API.
- `GET /health` Health check.

### Autenticación

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/complete-profile` (token requerido, perfil incompleto permitido)
- `GET /api/auth/profile-status` (token requerido)
- `GET /api/auth/me` (protegido)
- `POST /api/auth/logout` (protegido)
- `POST /api/auth/change-password` (protegido)

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

