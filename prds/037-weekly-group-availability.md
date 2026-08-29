# 037 - Disponibilidad semanal por grupo

## Estado

Implementado en backend y portal. La operación con datos reales, aislamiento tenant activo y migración sobre staging debe verificarse antes de producción.

## Problema y objetivo

Los horarios escolares deben ser administrados por la institución. Un docente puede registrar una clase en una hora válida, pero no fuera de los días y la jornada permitida para su grupo.

La primera versión de este flujo usa disponibilidad por grupo, no bloques fijos por materia: administración publica una ventana diaria reutilizable y el docente registra sesiones concretas dentro de ella.

## Alcance

- Configuración institucional de días lectivos.
- Una ventana de disponibilidad por grupo y año escolar.
- Borradores y publicación versionada por año escolar.
- Validación de fecha, zona horaria, jornada, asignación docente y conflictos de grupo/docente/aula.
- Sesiones persistentes sin proyección de ocurrencias virtuales.
- Excepciones administrativas explícitas, con motivo, `source: exception` y auditoría.
- Migración controlada desde datos existentes.

## Contrato y reglas

### Consulta para docentes

`GET /api/calendar/schedules/me?school_year_id=<id>` devuelve únicamente el horario publicado y los grupos/bloques asignados al docente autenticado. El portal usa esta consulta para que el docente seleccione un bloque válido antes de registrar una sesión.

### Horario

`WeeklySchedule` conserva `school_days` y agrega `availability_windows`:

```json
{
  "window_id": "window-7a",
  "group_id": "...",
  "start_time": "06:15",
  "end_time": "12:15"
}
```

Los bloques antiguos de materia se conservan para lectura histórica y no se convierten automáticamente en ventanas.

### Sesiones normales

`POST /api/calendar/sessions` está disponible para administración y docentes. La sesión debe:

- pertenecer al año escolar indicado;
- estar entre `start_date` y `end_date` del año escolar;
- usar un día incluido en el horario publicado;
- comenzar y terminar el mismo día;
- estar dentro de la ventana publicada del grupo;
- usar una asignación válida `teacher + group + area`;
- no cruzarse con otra sesión del grupo, docente o aula.

Las horas recibidas se interpretan en `Institution.timezone` y las fechas persistidas se mantienen en UTC.

### Excepciones

`POST /api/calendar/exceptions` es exclusivo de administración. Usa los mismos datos de sesión, exige `reason` y persiste `source: exception`, `is_manual_override: true` y `exception_reason`.

Una excepción no modifica la ventana publicada ni habilita al docente a crear sesiones fuera de ella.

## Migración y operación

Ejecutar con `TENANT_DATA_ISOLATION=false` y confirmación explícita:

```bash
SCHEDULE_MIGRATION_INSTITUTION_ID=<ObjectId> \
SCHEDULE_MIGRATION_CONFIRM=EDUCONNECT-SCHEDULE \
yarn migrate:schedule-availability
```

La migración crea borradores usando la jornada activa de cada grupo. No modifica horarios publicados con bloques antiguos; administración debe revisar y publicar cada borrador.

## Riesgos y límites

- Una ventana por grupo no expresa un horario fijo diferente por materia. Para reglas como “Sociales todos los lunes de 06:15 a 08:15” se requiere un modelo posterior de bloques recurrentes.
- Festivos, suspensiones y cambios por día específico no están incluidos; deben resolverse con excepciones o una futura política de calendario institucional.
- El aislamiento tenant debe estar activo y verificado en staging antes de usar datos institucionales reales.
