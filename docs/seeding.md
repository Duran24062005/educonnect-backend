# Datos de desarrollo

## Seed integral

El seed integral vive en `scripts/seed-demo.ts` y se ejecuta con:

```bash
yarn seed:demo
```

El script esta pensado para desarrollo y pruebas manuales. Es incremental e idempotente: usa claves estables por namespace, actualiza el registro demo si ya existe y no elimina datos ni ejecuta `dropDatabase`.

Para limpiar completamente la base de datos y volver a generar el dataset:

```bash
NODE_ENV=development \
SEED_RESET_CONFIRM=EDUCONNECT-RESET \
yarn seed:reset
```

`seed:reset` usa `scripts/seed-reset.ts` y exige la confirmación explícita antes de ejecutar `dropDatabase()`. El seed incremental de `scripts/seed-demo.ts` no borra datos. Ambos comandos muestran su ayuda con `--help`.

Este modo ejecuta `dropDatabase()` sobre la base indicada por `DATABASE_URL`, por lo que elimina tambien colecciones que no tengan un modelo importado por el seed. No lo ejecutes contra una base con datos que quieras conservar.

Variables opcionales:

```bash
SEED_NAMESPACE=colegio-a \
SEED_INSTITUTION_CODE=EDU-COLEGIO-A \
SEED_PASSWORD='EduConnect123!' \
yarn seed:demo
```

Si tu `.env` local tiene `NODE_ENV=production`, antepone `NODE_ENV=development` a los comandos de seed. La variable inline tiene prioridad para esa ejecucion y evita editar el archivo de entorno.

- `SEED_NAMESPACE`: separa las cuentas y claves del dataset. Por defecto es `demo`.
- `SEED_INSTITUTION_CODE`: codigo unico de la institucion. Por defecto es `EDU-<namespace>`.
- `SEED_PASSWORD`: password comun de las cuentas creadas por el seed. Solo debe usarse en desarrollo.
- `SEED_ANCHOR_DATE`: fecha ISO usada para sesiones, actividades, clases y asistencia. Por defecto es `2026-08-24T00:00:00.000Z`.

El script rechaza `NODE_ENV=production` salvo que exista la confirmacion explicita `SEED_CONFIRM=EDUCONNECT-DEMO`. El modo destructivo siempre esta bloqueado en produccion. No se recomienda ejecutar seeds en produccion.

## Bootstrap del SuperAdmin de plataforma

La cuenta global inicial no se crea por HTTP ni mediante el seed demo o seed reset. Se crea con el comando controlado:

```bash
SUPERADMIN_EMAIL='operaciones@educonnect.co' \
SUPERADMIN_PASSWORD='UnaClaveInicialSegura!' \
SUPERADMIN_FIRST_NAME='Equipo' \
SUPERADMIN_LAST_NAME='EduConnect' \
SUPERADMIN_DOCUMENT_TYPE='CC' \
SUPERADMIN_DOCUMENT_NUMBER='900000001' \
yarn bootstrap:superadmin
```

El comando es idempotente por correo: si ya existe un `SuperAdmin` activo, no duplica registros. Rechaza reutilizar un correo que pertenezca a otro rol o a una cuenta institucional. La contraseña debe tener al menos 12 caracteres y nunca se imprime ni se expone por una ruta HTTP. Ejecutarlo únicamente contra la base de datos objetivo y conservar las variables fuera del repositorio.

## Dataset generado

El dataset crea una institucion activa con cuentas de administrador, docente y acudiente. El acudiente tiene dos estudiantes vinculados, cada uno con matricula y grupo propio, para validar el alcance multiestudiante del portal familiar.

Ademas genera la estructura de secundaria y media de sexto a undecimo, con dos grupos por grado (`6A`, `6B`, `7A`, `7B`, ..., `11A`, `11B`) y cinco estudiantes matriculados activamente en cada grupo: 12 grupos y 60 estudiantes en total. `student.one` queda en `6A` y `student.two` en `6B` para conservar el escenario del portal familiar.

Ademas crea como minimo un registro valido para cada modelo persistente:

| Entidad | Ejemplo incluido |
| --- | --- |
| `Institution` | Colegio EduConnect Demo |
| `User` / `Person` | administrador, docente, acudiente y dos estudiantes |
| `Session` | sesion activa de desarrollo del administrador |
| `Teacher` / `Student` | perfiles especializados asociados a usuarios |
| `Campus` / `SchoolShift` | sede Centro y jornada manana |
| `SchoolYear` / `Period` | año 2026 y Periodo 1 |
| `Grade` / `Area` / `GradeArea` | Sexto a Undecimo, Matematicas y Lenguaje |
| `Group` / `Aula` | grupos 6A/6B hasta 11A/11B y un aula demo por grupo |
| `Enrollment` | 60 matriculas activas: cinco estudiantes por grupo |
| `GroupTeacher` | docente de Matemáticas asignado a los 12 grupos |
| `GradeItem` / `StudentGrade` | items y calificaciones de ambos estudiantes |
| `PeriodAreaResult` / `FinalResult` | resultados periodicos y anuales |
| `Activity` / `ActivitySubmission` | actividad publicada y entrega calificada |
| `ClassSession` | una clase para cada estudiante |
| `AttendanceSession` / `AttendanceRecord` | sesiones y marcas de asistencia |
| `StudentGuardian` | dos relaciones autorizadas con el mismo acudiente |
| `Notification` | bienvenida para el portal familiar |
| `AuditLog` | evento `seed.demo` |
| `ImportJob` | previsualizacion de importacion CSV |

## Credenciales demo por defecto

Con `SEED_NAMESPACE=demo`:

| Rol | Email |
| --- | --- |
| Admin | `admin.demo@educonnect.local` |
| Teacher | `teacher.demo@educonnect.local` |
| Parent | `parent.demo@educonnect.local` |
| Student | `student.one.demo@educonnect.local` y `student.two.demo@educonnect.local` |

La password por defecto es `EduConnect123!`. Cambiala o usa `SEED_PASSWORD` antes de compartir el entorno.

## Operacion recomendada

1. Verifica `DATABASE_URL` y confirma que apunta a la base local o de pruebas correcta.
2. Ejecuta `yarn seed:reset` con `SEED_RESET_CONFIRM=EDUCONNECT-RESET` cuando necesites un entorno limpio.
3. Ejecuta `yarn seed:demo` cuando quieras conservar los datos existentes y reconciliar el dataset demo.
4. Usa `SEED_NAMESPACE` y `SEED_INSTITUTION_CODE` para separar datasets dentro de una misma instancia.
