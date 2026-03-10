# 005 - Academic Structure Lifecycle

## Objetivo

Documentar la configuración base de la operación académica: años escolares, periodos, grados, áreas, aulas y promoción masiva entre años.

## Alcance

- CRUD parcial de años escolares.
- Activación de un único año escolar.
- Gestión de periodos.
- Gestión de grados.
- Gestión de áreas académicas.
- Gestión de aulas.
- Promoción masiva anual de estudiantes.

## Endpoints

- `GET /api/academic/school-years`
- `GET /api/academic/school-years/active`
- `POST /api/academic/school-years`
- `PATCH /api/academic/school-years/:id/activate`
- `DELETE /api/academic/school-years/:id`
- `POST /api/academic/promotions`
- `GET /api/academic/school-years/:school_year_id/periods`
- `POST /api/academic/periods`
- `DELETE /api/academic/periods/:id`
- `GET /api/academic/grades`
- `POST /api/academic/grades`
- `PUT /api/academic/grades/:id`
- `DELETE /api/academic/grades/:id`
- `GET /api/academic/areas`
- `POST /api/academic/areas`
- `PUT /api/academic/areas/:id`
- `DELETE /api/academic/areas/:id`
- `GET /api/academic/aulas`
- `POST /api/academic/aulas`
- `PUT /api/academic/aulas/:id`
- `DELETE /api/academic/aulas/:id`

## Permisos

- Consulta requiere autenticación.
- Creación, edición, eliminación, activación y promociones requieren rol `admin`.

## Funcionalidades

### 1. Años escolares

Entidad:

- Define el ciclo anual institucional.

Reglas:

- `year` obligatorio entre `2000` y `2100`.
- `start_date` debe ser menor a `end_date`.
- No se permiten años duplicados.
- Solo un año escolar puede estar activo a la vez.
- No se puede eliminar el año escolar activo.

### 2. Periodos

Entidad:

- Subdivisiones del año escolar con peso porcentual.

Request de creación:

```json
{
  "school_year_id": "65f0...",
  "name": "Periodo 1",
  "weight": 0.25,
  "start_date": "2026-02-01",
  "end_date": "2026-04-30"
}
```

Reglas:

- El peso de cada periodo debe estar entre `0` y `1`.
- La suma de todos los periodos del año no puede superar `1.0`.
- `start_date` debe ser menor a `end_date`.

### 3. Grados

Uso:

- Catálogo de niveles o cursos institucionales.

Campos:

- `name`
- `level`
- `description`

### 4. Áreas

Uso:

- Catálogo de áreas académicas como Matemáticas, Lenguaje o Ciencias.

Campos:

- `name`
- `description`

### 5. Aulas

Uso:

- Espacios físicos o lógicos con capacidad máxima.

Campos:

- `name`
- `max_capacity`

Reglas:

- La capacidad debe ser mayor a cero.

### 6. Promoción masiva anual

`POST /api/academic/promotions`

Request:

```json
{
  "from_school_year_id": "65f0...",
  "to_school_year_id": "65f1..."
}
```

Comportamiento:

- Revisa matrículas activas del año origen.
- Busca el resultado final de cada estudiante.
- Si `passed`, intenta moverlo al siguiente grado.
- Si `failed`, lo reubica en el mismo grado del nuevo año.
- Si el grado siguiente supera 11, lo marca como egresado.
- Si `repeating`, no mueve automáticamente y lo deja en revisión manual.

Reglas críticas:

- Deben existir año origen y destino.
- Deben ser distintos.
- Debe existir resultado final por estudiante.
- Debe existir configuración del grado destino.
- Debe haber cupo en un grupo del grado destino.
- Si hay inconsistencias, el proceso completo se aborta con error.

Respuesta:

- Incluye resumen de `promoted`, `repeated`, `graduated`, `manual_review` y casos manuales.

## Dependencias

- Repositorios académicos.
- Repositorios de grupos y estudiantes.
- Repositorios de matrículas y resultados finales.

## Riesgos y observaciones

- La promoción automática depende de la nomenclatura del grado para inferir el número de curso.
- La ausencia de cupos o resultados finales impide ejecutar el proceso completo.
- No existe endpoint de actualización para periodos ni años escolares, solo creación, activación y borrado.
