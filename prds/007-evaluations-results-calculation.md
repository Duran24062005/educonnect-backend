# 007 - Evaluations & Results Calculation

## Objetivo

Documentar la gestión de evaluación académica: ítems calificables, notas, consolidación por periodo, resultado final anual y estadísticas del año.

## Alcance

- Crear, listar, actualizar y eliminar ítems de evaluación.
- Registrar notas por estudiante.
- Consultar notas.
- Calcular resultados por área y periodo.
- Calcular resultados finales por año.
- Consultar estadísticas finales.

## Endpoints

- `GET /api/evaluations/grade-items`
- `POST /api/evaluations/grade-items`
- `PUT /api/evaluations/grade-items/:id`
- `DELETE /api/evaluations/grade-items/:id`
- `POST /api/evaluations/scores`
- `GET /api/evaluations/scores/student/:student_id`
- `GET /api/evaluations/scores/grade-item/:grade_item_id`
- `POST /api/evaluations/period-results/calculate`
- `GET /api/evaluations/period-results/student/:student_id`
- `POST /api/evaluations/final-results/calculate`
- `GET /api/evaluations/final-results/school-year/:school_year_id`
- `GET /api/evaluations/final-results/student/:student_id/year/:school_year_id`
- `GET /api/evaluations/stats/school-year/:school_year_id`

## Permisos

- Todas las rutas requieren autenticación.
- Crear/editar/eliminar ítems y registrar notas: `admin` o `teacher`.
- Calcular resultado de periodo: `admin` o `teacher`.
- Calcular resultado final anual y ver resultados globales del año: `admin`.

## Funcionalidades

### 1. Ítems de evaluación

`POST /api/evaluations/grade-items`

Request:

```json
{
  "name": "Quiz 1",
  "percentage": 20,
  "area_id": "65f0...",
  "period_id": "65f1..."
}
```

Reglas:

- Deben existir el periodo y el área.
- `percentage` debe estar entre `0` y `100`.
- La suma de porcentajes por `period + area` no puede superar `100`.

`GET /api/evaluations/grade-items`

Query obligatoria:

- `period_id`
- `area_id`

### 2. Registro de notas

`POST /api/evaluations/scores`

Request:

```json
{
  "student_id": "65f0...",
  "grade_item_id": "65f1...",
  "score": 8.5
}
```

Reglas:

- `score` debe estar entre `0` y `10`.
- El estudiante y el ítem deben existir.
- El registro funciona como `upsert`: si ya existe nota para el mismo estudiante e ítem, la actualiza.

### 3. Resultado por área y periodo

`POST /api/evaluations/period-results/calculate`

Request:

```json
{
  "student_id": "65f0...",
  "area_id": "65f1...",
  "period_id": "65f2..."
}
```

Lógica:

- Recupera todos los ítems del área en el periodo.
- Busca las notas del estudiante para esos ítems.
- Calcula promedio ponderado según `percentage`.
- Si no está evaluado el 100%, escala el promedio al porcentaje efectivamente evaluado.
- Guarda el resultado mediante `upsert`.

Errores comunes:

- No hay ítems de evaluación configurados.
- El estudiante no tiene ninguna nota para esa combinación.

### 4. Resultado final anual

`POST /api/evaluations/final-results/calculate`

Request:

```json
{
  "student_id": "65f0...",
  "school_year_id": "65f1..."
}
```

Lógica:

- Obtiene los periodos del año escolar.
- Toma los resultados por periodo del estudiante.
- Calcula promedio ponderado usando el `weight` de cada periodo.
- Si no hay datos suficientes, retorna error.
- Marca el estado final:
  - `passed` si la nota final es `>= 6`
  - `failed` si la nota final es `< 6`

Nota:

- El sistema contempla `repeating` en estadísticas y promociones, pero este servicio no lo genera automáticamente.

### 5. Consultas de resultados

- `GET /api/evaluations/period-results/student/:student_id`
- `GET /api/evaluations/final-results/school-year/:school_year_id?status=passed|failed|repeating`
- `GET /api/evaluations/final-results/student/:student_id/year/:school_year_id`

### 6. Estadísticas del año

`GET /api/evaluations/stats/school-year/:school_year_id`

Respuesta:

- Conteos de `passed`, `failed`, `repeating` y `total`.

## Dependencias

- Repositorios de periodos, áreas, ítems de evaluación, notas, resultados por periodo y resultados finales.

## Riesgos y observaciones

- La escala de notas es `0` a `10`.
- El umbral de aprobación está fijado en `6`.
- No se valida por endpoint que un docente solo registre notas para grupos/asignaciones propias; el control fino hoy está más desarrollado en analítica que en evaluación.
