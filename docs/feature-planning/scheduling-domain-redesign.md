# PRD: rediseño del dominio de horarios y sesiones

## Problema y objetivo

El calendario actual permite que un docente cree manualmente una `ClassSession` dentro de una ventana de disponibilidad. Esto mezcla autorización, programación institucional y planeación pedagógica, y deja al docente decidir datos que debe administrar la institución.

El flujo canónico será:

```text
TeachingAssignment → ScheduleEntry → ClassSession → LessonPlan
```

El administrador define quién enseña qué, a qué grupo, en qué horario y aula. El backend materializa las ocurrencias del horario publicado. El docente únicamente prepara el contenido pedagógico de sus sesiones.

## Alcance

- Reutilizar la colección existente de `GroupTeacher` como almacenamiento compatible de `TeachingAssignment`.
- Separar las entradas semanales en `ScheduleEntry`.
- Generar sesiones concretas al publicar un horario.
- Separar la planeación docente en `LessonPlan`.
- Modelar excepciones administrativas sin modificar el horario base.
- Mantener lectura y migración compatible de horarios y sesiones legacy.
- Hacer cumplir todas las reglas en el backend.

Queda fuera de este corte cualquier cambio del repositorio frontend.

## Modelo y reglas

### TeachingAssignment

Representa la autorización académica `docente + grupo + área + año escolar`. Se implementa sobre la colección existente `groupteachers` para no duplicar datos. Incluye `school_year_id` explícito y `status` (`active` o `inactive`). Los campos académicos son inmutables en la API canónica; una reasignación se modela desactivando y creando otra asignación.

### ScheduleEntry

Representa un bloque del horario semanal y referencia una asignación activa. Contiene horario, día lectivo, aula y sede. No es una ocurrencia de fecha concreta.

### ClassSession

Representa una ocurrencia materializada. Las sesiones generadas contienen `schedule_entry_id`, `schedule_id` y `occurrence_date`. Las sesiones legacy se conservan con `source: legacy`. Sus campos administrativos no son editables por docentes.

### LessonPlan

Es una relación uno a uno con `ClassSession`. Tiene `topic`, `learning_objective`, `description`, `teacher_notes`, `homework` y estado `draft/completed`. El docente propietario puede editarla; estudiantes y acudientes solo ven planeaciones completadas.

### ScheduleException

Representa una cancelación, modificación de horario/aula o evento adicional. Nunca elimina ni muta la entrada semanal original. Las excepciones generan o actualizan sesiones concretas y quedan auditadas.

## API canónica

- `GET/POST/PATCH /api/teaching-assignments`
- `GET /api/calendar/schedules`
- `GET/POST/PATCH/DELETE /api/calendar/schedules/:id/entries`
- `GET /api/calendar/me`
- `GET /api/calendar`
- `GET /api/calendar/sessions/:id`
- `GET/POST/PATCH /api/lesson-plans`
- `POST /api/calendar/exceptions`

Las rutas existentes de asignación, slots y lectura de sesiones se mantienen como adaptadores durante la transición. La creación manual de sesiones por docentes deja de ser válida.

## Materialización y cambios

Publicar un horario valida referencias, jornada, disponibilidad, sede y conflictos de grupo, docente y aula. Después genera una sesión por entrada y día lectivo dentro del año escolar. Al publicar una nueva versión:

- las sesiones pasadas permanecen intactas;
- las sesiones futuras de entradas retiradas se cancelan con razón administrativa;
- las entradas nuevas generan ocurrencias;
- las ocurrencias equivalentes se actualizan conservando su planeación cuando aún están programadas.

El índice único de entrada y fecha evita duplicados.

## Migración, riesgos y rollback

La migración es aditiva. Primero ejecuta un dry-run y reporta referencias inválidas, asignaciones incompletas, slots sin asignación y aulas sin sede. Después puede escribir `school_year_id`, `status`, entradas y enlaces de sesiones sin borrar campos legacy.

Uso recomendado:

```bash
yarn migrate:scheduling-domain
SCHEDULING_MIGRATION_APPLY=true \
SCHEDULING_MIGRATION_CONFIRM=EDUCONNECT-SCHEDULING \
yarn migrate:scheduling-domain
```

Se puede limitar una ejecución con `SCHEDULING_MIGRATION_INSTITUTION_ID`. La primera ejecución debe ser siempre el dry-run y su reporte debe revisarse antes de aplicar cambios.

El rollback operativo consiste en no activar el flujo canónico y restaurar un backup MongoDB si fuera necesario. No se eliminan documentos existentes ni se sobreescriben sesiones legacy.

## Criterios de aceptación

- Un administrador publica una asignación válida y el backend genera sesiones.
- Un docente ve sus sesiones sin crearlas.
- Un docente no puede cambiar datos administrativos ni crear sesiones manuales.
- Un docente puede crear y editar la planeación de sus sesiones.
- Se rechazan conflictos, años, áreas, jornadas, disponibilidades y sedes inválidas.
- Las excepciones no destruyen el horario original.
- Estudiantes y acudientes solo reciben sesiones autorizadas y planeaciones completadas.
- La suite existente de calendario, materiales, asistencia y tenant isolation continúa pasando.
