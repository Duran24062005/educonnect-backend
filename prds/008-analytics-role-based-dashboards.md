# 008 - Analytics & Role-Based Dashboards

## Objetivo

Documentar los endpoints analíticos del sistema para estudiantes, docentes y administradores, incluyendo filtros, reglas de autorización y estructura de datos entregada a los dashboards.

## Alcance

- Analítica de estudiante.
- Analítica de docente por grupo, área y estudiante.
- Analítica administrativa institucional, por grado y por área.

## Endpoints

### Estudiante

- `GET /api/analytics/student/me/overview`
- `GET /api/analytics/student/me/areas`
- `GET /api/analytics/student/me/area-trend`
- `GET /api/analytics/student/me/period-summary`

### Docente

- `GET /api/analytics/teacher/me/groups`
- `GET /api/analytics/teacher/me/group-performance`
- `GET /api/analytics/teacher/me/group-trend`
- `GET /api/analytics/teacher/me/student-detail`

### Administrador

- `GET /api/analytics/admin/institution-overview`
- `GET /api/analytics/admin/institution-trend`
- `GET /api/analytics/admin/by-grade`
- `GET /api/analytics/admin/by-area`
- `GET /api/analytics/admin/grade-detail`

## Reglas de acceso

- Todas las rutas requieren autenticación.
- Cada bloque está restringido por rol:
  - Estudiante: `student`
  - Docente: `teacher`
  - Administrador: `admin`
- Todas las consultas exigen `school_year_id`.

## Analítica de estudiante

### 1. Resumen general

`GET /api/analytics/student/me/overview?school_year_id=...`

Entrega:

- promedio general
- áreas aprobadas
- áreas reprobadas
- estado final estimado o calculado

### 2. Promedio por áreas

`GET /api/analytics/student/me/areas?school_year_id=...`

Entrega:

- lista de áreas con `final_average` y `status`

### 3. Tendencia de un área

`GET /api/analytics/student/me/area-trend?school_year_id=...&area_id=...`

Entrega:

- una fila por periodo con `average` y `status`

### 4. Resumen por periodos

`GET /api/analytics/student/me/period-summary?school_year_id=...`

Entrega:

- promedio general por periodo
- conteo de áreas aprobadas y reprobadas por periodo

## Analítica de docente

### 1. Grupos asignados

`GET /api/analytics/teacher/me/groups?school_year_id=...`

Entrega:

- grupo
- grado
- área asociada a la asignación

### 2. Rendimiento del grupo

`GET /api/analytics/teacher/me/group-performance?school_year_id=...&group_id=...&area_id=...&period_id=...`

`period_id` es opcional.

Entrega:

- resumen del grupo: cantidad de estudiantes, promedio, aprobados y reprobados
- detalle por estudiante con promedio y estado

Regla crítica:

- El docente debe tener asignación real sobre ese `group_id + area_id` en el año consultado.

### 3. Tendencia del grupo

`GET /api/analytics/teacher/me/group-trend?school_year_id=...&group_id=...&area_id=...`

Entrega:

- evolución por periodo del promedio del grupo
- aprobados y reprobados por periodo

### 4. Detalle individual de estudiante

`GET /api/analytics/teacher/me/student-detail?school_year_id=...&student_id=...&area_id=...`

Entrega:

- nombre del estudiante
- área
- promedio final del área
- promedio por periodo

Regla crítica:

- El estudiante debe estar matriculado en el año consultado.
- El docente debe tener permiso sobre el grupo y área de ese estudiante.

## Analítica administrativa

### 1. Vista institucional

`GET /api/analytics/admin/institution-overview?school_year_id=...&period_id=...`

`period_id` es opcional.

Entrega:

- sin `period_id`: resumen con resultados finales del año
- con `period_id`: resumen calculado desde resultados por periodo

### 2. Tendencia institucional

`GET /api/analytics/admin/institution-trend?school_year_id=...`

Entrega:

- evolución por periodos del promedio institucional
- aprobados y reprobados por periodo

### 3. Vista por grado

`GET /api/analytics/admin/by-grade?school_year_id=...&period_id=...`

Entrega:

- promedio por grado
- aprobados y reprobados por grado

### 4. Vista por área

`GET /api/analytics/admin/by-area?school_year_id=...&grade_id=...&period_id=...`

Filtros opcionales:

- `grade_id`
- `period_id`

Entrega:

- promedio por área
- aprobados y reprobados por área

### 5. Detalle de grado

`GET /api/analytics/admin/grade-detail?school_year_id=...&grade_id=...&period_id=...`

Entrega:

- metadatos del grado
- métricas por grupo del grado
- promedio por áreas del grado

## Reglas de negocio

- El sistema usa umbral de aprobación `>= 6`.
- Si faltan resultados, algunos promedios se completan con `0` para mantener consistencia del dashboard.
- La analítica depende de resultados consolidados ya calculados en `periodAreaResult` y `finalResult`.

## Dependencias

- `AnalyticsService`
- `AnalyticsRepository`
- matrículas activas
- asignaciones docente-grupo-área
- resultados de periodo y finales

## Riesgos y observaciones

- Si aún no se han calculado resultados de periodo o finales, los dashboards pueden verse incompletos.
- El módulo está optimizado para lectura; no genera ni corrige datos académicos.
