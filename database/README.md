<div align="center">

# EduConnect - Documentacion de Base de Datos

**Base de datos MongoDB utilizada por `educonnect-backend`**

---

**Autor:** Alexi Duran Gomez  
**Proyecto:** EduConnect Backend  
**Stack:** Node.js + MongoDB + Mongoose  
**Base por defecto:** `educonnect`  
**Fecha:** 2026-03-13

---

</div>

## Indice

1. [Introduccion](#introduccion)
   - [Objetivo del sistema](#objetivo-del-sistema)
   - [Tecnologia utilizada](#tecnologia-utilizada)
2. [Caso de estudio](#caso-de-estudio)
   - [Problematica actual](#problematica-actual)
   - [Solucion propuesta](#solucion-propuesta)
3. [Justificacion del uso de MongoDB](#justificacion-del-uso-de-mongodb)
4. [Planificacion](#planificacion)
   - [Modelo conceptual](#modelo-conceptual)
   - [Resumen de colecciones](#resumen-de-colecciones)
5. [Construccion del modelo logico](#construccion-del-modelo-logico)
   - [Identidad y acceso](#identidad-y-acceso)
   - [Estructura academica](#estructura-academica)
   - [Evaluacion academica](#evaluacion-academica)
   - [Actividades y entregas](#actividades-y-entregas)
   - [Notificaciones](#notificaciones)
6. [Normalizacion del modelo logico](#normalizacion-del-modelo-logico)
7. [Construccion del modelo fisico](#construccion-del-modelo-fisico)
   - [Conexion y despliegue](#conexion-y-despliegue)
   - [Validaciones implementadas](#validaciones-implementadas)
   - [Indices](#indices)
   - [Referencias vs embebidos](#referencias-vs-embebidos)
8. [Datos de prueba y seeds](#datos-de-prueba-y-seeds)
9. [Agregaciones y consultas analiticas](#agregaciones-y-consultas-analiticas)
10. [Roles, seguridad y control de acceso](#roles-seguridad-y-control-de-acceso)
11. [Transacciones y consistencia](#transacciones-y-consistencia)
12. [Conclusiones y mejoras posibles](#conclusiones-y-mejoras-posibles)
13. [Referencias](#referencias)

---

## Introduccion

Este documento describe la base de datos NoSQL usada por el backend de **EduConnect**, una plataforma de gestion educativa orientada a autenticacion, usuarios, estructura academica, matriculas, evaluaciones, actividades, analitica y notificaciones in-app.

La documentacion sigue la estructura esperada en el repositorio de referencia `Proyecto_MongoDB2_S2_DuranAlexi_MantillaEsteban`, pero esta aterrizada al estado real del backend actual. A diferencia del repo de referencia, aqui la definicion del modelo fisico no vive en scripts `db.createCollection()` con `$jsonSchema`, sino en **schemas de Mongoose** dentro de `src/models/`.

### Objetivo del sistema

La base de datos debe permitir:

- Gestionar usuarios y perfiles personales con roles diferenciados.
- Mantener la estructura academica de anos, periodos, grados, areas, grupos y aulas.
- Registrar matriculas, traslados y cupos.
- Administrar items de evaluacion, notas, resultados por periodo y resultados finales.
- Publicar actividades con rubricas y recibir entregas de estudiantes.
- Enviar notificaciones y anuncios segmentados por rol o grupo.
- Soportar consultas de analitica y dashboards para administradores, docentes y estudiantes.

### Tecnologia utilizada

- **Motor:** MongoDB 7
- **ODM:** Mongoose 8
- **Runtime:** Node.js 20
- **API:** Express 5
- **Base por defecto:** `educonnect`
- **Conexion local por defecto:** `mongodb://admin:admin123@localhost:27017/educonnect?authSource=admin`
- **Testing aislado:** `mongodb-memory-server`

---

## Caso de estudio

**EduConnect** centraliza la operacion de una institucion educativa que necesita administrar cuentas, perfiles, grupos, docentes, estudiantes, periodos y resultados academicos sin depender de hojas de calculo o sistemas separados.

### Problematica actual

1. Los datos de acceso, perfil y rol de un usuario no pueden vivir en una sola tabla fija sin perder flexibilidad.
2. La estructura academica cambia por ano escolar, periodo, grado y grupo, y debe mantenerse historica.
3. Las matriculas y traslados requieren trazabilidad, control de cupos y consistencia entre documentos.
4. Las actividades necesitan guardar reglas de entrega, rubricas y evidencias por estudiante.
5. Los dashboards requieren consultas rapidas sobre matriculas, resultados y desempeno.

### Solucion propuesta

La solucion actual usa MongoDB con Mongoose para modelar el dominio en colecciones separadas, apoyandose en:

- Referencias entre documentos para preservar integridad logica y trazabilidad.
- Documentos embebidos cuando el dato pertenece naturalmente al documento padre.
- Indices unicos y compuestos para proteger reglas clave y acelerar consultas.
- Validaciones de schema y validaciones adicionales en la capa de servicios.
- Seeds de desarrollo para poblar estructura academica y dataset de analitica.

---

## Justificacion del uso de MongoDB

### 1. Flexibilidad de esquema

El sistema combina identidades, perfiles, asignaciones docentes, matriculas, resultados y notificaciones. MongoDB permite crecer el modelo sin migraciones rigidas de un esquema relacional clasico.

### 2. Modelo de documentos cercano a Node.js

Los documentos se consumen desde Express y Mongoose usando objetos JSON, lo que reduce friccion al mapear payloads HTTP, respuestas y relaciones.

### 3. Mezcla natural de referencias y embebidos

El proyecto usa referencias para datos historicos y compartidos, y embebidos para rubricas y evaluaciones por criterio, donde el dato tiene sentido dentro del documento padre.

### 4. Buen soporte para lectura agregada

El backend expone dashboards y listados enriquecidos. MongoDB permite usar `aggregate()`, `lookup` e indices compuestos para resolver esas lecturas.

### 5. Escalabilidad del dominio academico

La institucion puede agregar nuevos anos, periodos, grupos, estudiantes o actividades sin redisenar la estructura base.

### 6. Integracion con autenticacion y APIs

Mongoose facilita hooks, validaciones, `populate()` y ocultamiento de campos sensibles como contrasenas.

### 7. Semantica adecuada para historicos

Colecciones como `enrollments`, `periodarearesults`, `finalresults` y `activitysubmissions` modelan eventos historicos y estados de negocio de forma natural.

---

## Planificacion

### Modelo conceptual

El dominio gira alrededor de **usuarios** y **personas**. Un `user` almacena credenciales y un `person` almacena el perfil personal y el rol. A partir de ahi se abren perfiles especializados (`students`, `teachers`) y una estructura academica compuesta por `schoolyears`, `periods`, `grades`, `areas`, `groups`, `gradeareas`, `groupteachers` y `aulas`.

Encima de esa estructura operan:

- `enrollments` para la matricula historica.
- `gradeitems`, `studentgrades`, `periodarearesults` y `finalresults` para evaluacion.
- `activities` y `activitysubmissions` para tareas y entregas.
- `notifications` para comunicacion in-app.

```mermaid
erDiagram
    USERS ||--o| PEOPLE : "person_id / user_id"
    USERS ||--o| STUDENTS : "perfil estudiante"
    USERS ||--o| TEACHERS : "perfil docente"

    SCHOOLYEARS ||--o{ PERIODS : contiene
    SCHOOLYEARS ||--o{ GROUPS : organiza
    SCHOOLYEARS ||--o{ ENROLLMENTS : registra
    SCHOOLYEARS ||--o{ ACTIVITIES : contextualiza
    SCHOOLYEARS ||--o{ FINALRESULTS : consolida

    GRADES ||--o{ GROUPS : agrupa
    GRADES ||--o{ GRADEAREAS : define
    AREAS ||--o{ GRADEAREAS : participa
    AREAS ||--o{ GRADEITEMS : evalua
    AREAS ||--o{ PERIODAREARESULTS : consolida
    AREAS ||--o{ GROUPTEACHERS : asigna
    AREAS ||--o{ ACTIVITIES : contextualiza

    GROUPS ||--o{ ENROLLMENTS : recibe
    GROUPS ||--o{ GROUPTEACHERS : asigna
    GROUPS ||--o{ ACTIVITIES : contiene

    TEACHERS ||--o{ GROUPTEACHERS : dicta
    TEACHERS ||--o{ ACTIVITIES : crea

    STUDENTS ||--o{ ENROLLMENTS : pertenece
    STUDENTS ||--o{ STUDENTGRADES : obtiene
    STUDENTS ||--o{ PERIODAREARESULTS : consolida
    STUDENTS ||--o{ FINALRESULTS : cierra
    STUDENTS ||--o{ ACTIVITYSUBMISSIONS : entrega
    AULAS ||--o{ STUDENTS : ubica

    PERIODS ||--o{ GRADEITEMS : contiene
    PERIODS ||--o{ PERIODAREARESULTS : consolida
    PERIODS ||--o{ ACTIVITIES : contextualiza

    GRADEITEMS ||--o{ STUDENTGRADES : califica
    ACTIVITIES ||--o{ ACTIVITYSUBMISSIONS : recibe
    USERS ||--o{ NOTIFICATIONS : recibe
```

### Resumen de colecciones

| Dominio | Coleccion real | Modelo | Proposito |
| --- | --- | --- | --- |
| Identidad | `users` | `User` | Credenciales y enlace con perfil |
| Identidad | `people` | `Person` | Perfil personal, rol y estado |
| Identidad | `students` | `Student` | Perfil academico del estudiante |
| Identidad | `teachers` | `Teacher` | Perfil academico del docente |
| Academico | `schoolyears` | `SchoolYear` | Ciclos escolares |
| Academico | `periods` | `Period` | Periodos evaluativos |
| Academico | `grades` | `Grade` | Grados escolares |
| Academico | `areas` | `Area` | Areas o materias |
| Academico | `gradeareas` | `GradeArea` | Relacion grado-area |
| Academico | `groups` | `Group` | Grupos por grado y ano |
| Academico | `groupteachers` | `GroupTeacher` | Asignacion docente por grupo y area |
| Academico | `aulas` | `Aula` | Aulas fisicas y cupos |
| Academico | `enrollments` | `Enrollment` | Matriculas y traslados |
| Evaluacion | `gradeitems` | `GradeItem` | Componentes evaluativos |
| Evaluacion | `studentgrades` | `StudentGrade` | Nota del estudiante por item |
| Evaluacion | `periodarearesults` | `PeriodAreaResult` | Resultado por area y periodo |
| Evaluacion | `finalresults` | `FinalResult` | Resultado final anual |
| Actividades | `activities` | `Activity` | Actividades publicadas |
| Actividades | `activitysubmissions` | `ActivitySubmission` | Entregas de estudiantes |
| Comunicacion | `notifications` | `Notification` | Notificaciones y anuncios |

---

## Construccion del modelo logico

### Identidad y acceso

#### `users`

- **Proposito:** almacenar credenciales y la referencia opcional al perfil personal.
- **Campos clave:** `email`, `hash_password`, `person_id`.
- **Validaciones destacadas:** email valido, normalizado a lowercase, maximo 150 caracteres, contrasena minima de 8 caracteres.
- **Comportamiento especial:** `hash_password` se hashea con `bcryptjs` en `pre('save')`, no se devuelve por defecto (`select: false`) y se elimina del `toJSON()`.
- **Indices:** `email` unico; `person_id` unico parcial solo cuando `person_id != null`.

#### `people`

- **Proposito:** entidad central con informacion personal, rol, estado y documento.
- **Campos clave:** `user_id`, `first_name`, `last_name`, `role`, `status`, `document_type`, `document_number`.
- **Validaciones destacadas:** documento alfanumerico con guion, min 4 y max 20 caracteres; roles permitidos `Student`, `Teacher`, `Admin`, `Parent`, `Guardian`; estados permitidos `active`, `inactive`, `pending`, `blocked`, `egresado`.
- **Diseno:** mantiene relacion bidireccional con `users` (`User.person_id` y `Person.user_id`).
- **Indices:** `user_id` unico, `document_number` unico, `role`, `status`.
- **Nota funcional:** el flujo actual de autenticacion normaliza `Guardian` a `Parent` al completar el perfil.

#### `students`

- **Proposito:** perfil especializado del estudiante.
- **Campos clave:** `user_id`, `aula_id`, `group_id`.
- **Validaciones destacadas:** `user_id` obligatorio y unico; `aula_id` y `group_id` son opcionales.
- **Diseno:** `group_id` actua como puntero al grupo actual, mientras el historico real vive en `enrollments`.
- **Indices:** `user_id` unico, `group_id`, `aula_id`.

#### `teachers`

- **Proposito:** perfil especializado del docente.
- **Campos clave:** `user_id`, `area`.
- **Validaciones destacadas:** `user_id` obligatorio y unico; `area` es descriptivo y opcional.
- **Diseno:** la asignacion docente real por grupo y materia se resuelve en `groupteachers`, no en este documento.
- **Indices:** `user_id` unico, `area`.

### Estructura academica

#### `schoolyears`

- **Proposito:** representar cada ano o ciclo academico.
- **Campos clave:** `year`, `start_date`, `end_date`, `is_active`.
- **Validaciones destacadas:** `year` entre 2000 y 2100; fechas obligatorias.
- **Indices:** `year` unico, `is_active`.
- **Reglas de negocio en servicio:** el backend intenta mantener un solo ano activo a la vez desde `AcademicService`, pero no existe un indice unico parcial para esa regla.

#### `periods`

- **Proposito:** dividir el ano escolar en cortes evaluativos.
- **Campos clave:** `school_year_id`, `name`, `weight`, `start_date`, `end_date`.
- **Validaciones destacadas:** `weight` entre `0` y `1`, nombres maximo 100 caracteres.
- **Indices:** `school_year_id`; `{ school_year_id, start_date }`.
- **Reglas de negocio en servicio:** la suma de pesos de todos los periodos de un ano no puede superar `1.0`.

#### `grades`

- **Proposito:** catalogo de grados.
- **Campos clave:** `name`, `level`, `description`.
- **Validaciones destacadas:** nombre obligatorio, `level` y `description` opcionales.
- **Indices:** `name`; `{ level, name }`.

#### `areas`

- **Proposito:** catalogo de materias o areas academicas.
- **Campos clave:** `name`, `description`.
- **Validaciones destacadas:** nombre obligatorio, maximo 100 caracteres.
- **Indices:** `name`.

#### `gradeareas`

- **Proposito:** relacion N:M entre grado y area, con carga horaria.
- **Campos clave:** `grade_id`, `area_id`, `weekly_hours`.
- **Validaciones destacadas:** `weekly_hours >= 1`.
- **Indices:** `{ grade_id, area_id }` unico; `area_id`.
- **Uso:** controla que solo las areas asignadas al grado puedan ser usadas luego en grupos y asignaciones docentes.

#### `groups`

- **Proposito:** grupos de estudiantes por grado y ano escolar.
- **Campos clave:** `name`, `grade_id`, `school_year_id`, `max_capacity`.
- **Validaciones destacadas:** nombre obligatorio, `max_capacity >= 1`.
- **Indices:** `school_year_id`, `grade_id`, `{ school_year_id, grade_id }`, `{ school_year_id, grade_id, name }` unico.
- **Reglas de negocio en servicio:** no se permite eliminar un grupo con estudiantes activos.

#### `groupteachers`

- **Proposito:** asignar un docente a un grupo en un area concreta.
- **Campos clave:** `teacher_id`, `group_id`, `area_id`.
- **Validaciones destacadas:** las tres referencias son obligatorias.
- **Indices:** `teacher_id`, `group_id`, `{ group_id, area_id }`, `{ teacher_id, group_id, area_id }` unico.
- **Reglas de negocio en servicio:** el area debe pertenecer al grado del grupo y no puede duplicarse la asignacion.

#### `aulas`

- **Proposito:** representar aulas fisicas y su capacidad.
- **Campos clave:** `name`, `max_capacity`.
- **Validaciones destacadas:** `max_capacity >= 1`.
- **Indices:** no declara indices adicionales.
- **Reglas de negocio en servicio:** `StudentService` evita sobreasignar estudiantes a un aula.

#### `enrollments`

- **Proposito:** historico de matriculas, retiros y traslados.
- **Campos clave:** `student_id`, `school_year_id`, `group_id`, `status`, `previous_enrollment_id`, `closed_at`.
- **Validaciones destacadas:** `status` en `active`, `transferred`, `retired`; campos de observacion y motivo con limites de longitud.
- **Indices:** `student_id`, `group_id`, `school_year_id`, `{ group_id, status }`, `{ student_id, school_year_id }` unico parcial para `status: "active"`.
- **Diseno:** el indice unico parcial garantiza una sola matricula activa por estudiante y ano.
- **Reglas de negocio en servicio:** valida pertenencia del grupo al ano, cupos maximos y trazabilidad de traslados.

### Evaluacion academica

#### `gradeitems`

- **Proposito:** definir cada item evaluativo de un area en un periodo.
- **Campos clave:** `name`, `percentage`, `area_id`, `period_id`.
- **Validaciones destacadas:** `percentage` entre `0` y `100`.
- **Indices:** `{ area_id, period_id }`; `period_id`.
- **Reglas de negocio en servicio:** la suma de porcentajes por area y periodo no puede superar el 100%.

#### `studentgrades`

- **Proposito:** guardar la nota puntual de un estudiante para un item evaluativo.
- **Campos clave:** `student_id`, `grade_item_id`, `score`.
- **Validaciones destacadas:** `score` entre `0` y `10`.
- **Indices:** `student_id`, `grade_item_id`, `{ student_id, grade_item_id }` unico.

#### `periodarearesults`

- **Proposito:** consolidar la nota final de un estudiante en un area dentro de un periodo.
- **Campos clave:** `student_id`, `area_id`, `period_id`, `final_score`.
- **Validaciones destacadas:** `final_score` entre `0` y `10`.
- **Indices:** `student_id`, `{ period_id, area_id }`, `{ student_id, area_id, period_id }` unico.
- **Generacion:** se calcula a partir de `gradeitems` + `studentgrades`.

#### `finalresults`

- **Proposito:** cerrar el desempeno anual del estudiante.
- **Campos clave:** `student_id`, `school_year_id`, `final_score`, `status`.
- **Validaciones destacadas:** `final_score` entre `0` y `10`; `status` en `passed`, `failed`, `repeating`.
- **Indices:** `{ student_id, school_year_id }` unico; `{ school_year_id, status }`.
- **Uso:** sirve como insumo para procesos de promocion o repeticion.

### Actividades y entregas

#### `activities`

- **Proposito:** publicar actividades academicas asociadas a grupo, area, periodo y docente.
- **Campos clave:** `title`, `description`, `context`, `group_id`, `area_id`, `period_id`, `school_year_id`, `teacher_id`, `open_at`, `due_at`, `allowed_extensions`, `rubric_criteria`, `status`.
- **Validaciones destacadas:** texto con limites de longitud; al menos una extension permitida; al menos un criterio de rubrica; estado actual `published`.
- **Embebidos:** `rubric_criteria` guarda criterios con `title`, `description` y `max_points`.
- **Indices:** `{ teacher_id, created_at: -1 }`, `{ group_id, area_id, period_id }`, `{ school_year_id, group_id, due_at }`.
- **Reglas de negocio en servicio:** el docente debe estar asignado al grupo y area; `due_at` debe ser posterior a `open_at`; la rubrica queda bloqueada si ya existe una entrega.

#### `activitysubmissions`

- **Proposito:** registrar la entrega de un estudiante para una actividad.
- **Campos clave:** `activity_id`, `student_id`, `submission_type`, `link_url`, `file_url`, `file_name`, `submitted_at`, `status`, `rubric_scores`, `earned_points`, `max_points`, `score_10`, `teacher_feedback`, `graded_at`.
- **Validaciones destacadas:** `submission_type` en `file` o `link`; `score_10` entre `0` y `10`; tamanos y longitudes controlados.
- **Embebidos:** `rubric_scores` captura la evaluacion por criterio con `criterion_id`, `title`, `max_points`, `earned_points` y `feedback`.
- **Indices:** `activity_id`, `{ student_id, submitted_at: -1 }`, `{ activity_id, student_id }` unico.
- **Reglas de negocio en servicio:** una entrega debe ser archivo o link, nunca ambos; respeta ventana de apertura/cierre y formatos permitidos.

### Notificaciones

#### `notifications`

- **Proposito:** manejar notificaciones individuales y anuncios masivos dentro de la plataforma.
- **Campos clave:** `recipient_user_id`, `type`, `title`, `message`, `audience_role`, `read_at`, `created_by_user_id`, `created_by_role`, `source_type`, `source_id`, `metadata`.
- **Validaciones destacadas:** tipos permitidos `activity_created`, `activity_submitted`, `admin_announcement`, `teacher_announcement`; audiencias `admin`, `teacher`, `student`.
- **Flexibilidad:** `metadata` es `Mixed`, lo que permite adaptar el payload segun el origen del evento.
- **Indices:** `recipient_user_id`, `type`, `audience_role`, `read_at`, `{ recipient_user_id, created_at: -1 }`, `{ recipient_user_id, read_at, created_at: -1 }`.
- **Uso:** soporta bandeja personal, conteo de no leidas, anuncios de admin y anuncios de docente.

---

## Normalizacion del modelo logico

Aunque MongoDB no exige normalizacion clasica como una base relacional, el modelo de EduConnect sigue principios cercanos a 1FN, 2FN y 3FN:

### Primera Forma Normal (1FN)

- Los campos son atomicos en casi todas las colecciones.
- Los arreglos embebidos (`rubric_criteria`, `rubric_scores`) contienen subdocumentos cohesivos y no listas ambiguas de valores.
- Las referencias a otras colecciones se expresan con `ObjectId`.

### Segunda Forma Normal (2FN)

- Las relaciones N:M se resuelven con colecciones especificas (`gradeareas`, `groupteachers`).
- Las notas por estudiante e item se separan en `studentgrades`, evitando duplicar columnas por evaluacion.
- Las matriculas historicas viven en `enrollments`, no dentro del documento de estudiante.

### Tercera Forma Normal (3FN)

- Los catalogos maestros (`areas`, `grades`, `schoolyears`, `periods`) se mantienen separados.
- No se repite informacion de persona dentro de `users`, `students` o `teachers`.
- Las relaciones historicas y de consolidacion (`periodarearesults`, `finalresults`) se calculan y almacenan sin contaminar entidades maestras.

### Desnormalizacion controlada

El modelo tambien aplica desnormalizacion intencional:

- `students.group_id` conserva el grupo actual para lecturas rapidas.
- `teachers.area` sirve como descriptor libre, aunque la asignacion formal se resuelve en `groupteachers`.
- `activitysubmissions.rubric_scores` replica datos de la rubrica evaluada para conservar el contexto de calificacion.
- `notifications.metadata` permite empaquetar datos listos para UI sin joins adicionales.

---

## Construccion del modelo fisico

### Conexion y despliegue

La aplicacion se conecta a MongoDB usando `src/config/config.js`. La prioridad de la cadena de conexion es:

1. `DATABASE_URL`
2. `MONGO_URI_CLOUD`
3. URI local por defecto: `mongodb://admin:admin123@localhost:27017/educonnect?authSource=admin`

En `docker-compose.yml` se define:

- contenedor `mongodb` sobre `mongo:7`
- usuario por defecto `admin`
- password por defecto `admin123`
- persistencia en volumen `mongo_data`
- base inicial `educonnect`

**Importante:** las colecciones se crean de manera implicita cuando Mongoose escribe por primera vez. No existe hoy un script en `database/` que haga `db.createCollection()` con validadores nativos de MongoDB.

### Validaciones implementadas

Las validaciones actuales se dividen en dos niveles:

#### 1. Validaciones de Mongoose

- Tipos (`String`, `Number`, `Date`, `ObjectId`, `Mixed`, arreglos).
- Campos requeridos.
- Rangos numericos.
- Longitudes minimas y maximas.
- `enum` para estados, roles, tipos y audiencias.
- `match` para documento de identidad.
- `trim`, `lowercase` y valores por defecto.

#### 2. Validaciones de servicio

- Un estudiante no puede tener dos matriculas activas en el mismo ano escolar.
- Un grupo no puede exceder su capacidad.
- Un aula no puede exceder su capacidad.
- La suma de pesos de periodos por ano no supera `1.0`.
- La suma de porcentajes de `gradeitems` por area y periodo no supera `100`.
- Un docente solo puede crear actividades sobre grupos y areas que tenga asignados.
- Una rubrica no puede modificarse si ya existen entregas.
- Una entrega debe respetar ventana de tiempo y formato permitido.

### Indices

El proyecto declara **55 indices** distribuidos en 20 colecciones. La siguiente lista resume los indices reales definidos en los schemas:

#### Identidad

**`users`**

- `{ email: 1 }` unico.
- `{ person_id: 1 }` unico parcial cuando `person_id != null`.

**`people`**

- `{ user_id: 1 }` unico.
- `{ document_number: 1 }` unico.
- `{ role: 1 }`.
- `{ status: 1 }`.

**`students`**

- `{ user_id: 1 }` unico.
- `{ group_id: 1 }`.
- `{ aula_id: 1 }`.

**`teachers`**

- `{ user_id: 1 }` unico.
- `{ area: 1 }`.

#### Estructura academica

**`schoolyears`**

- `{ year: 1 }` unico.
- `{ is_active: 1 }`.

**`periods`**

- `{ school_year_id: 1 }`.
- `{ school_year_id: 1, start_date: 1 }`.

**`grades`**

- `{ name: 1 }`.
- `{ level: 1, name: 1 }`.

**`areas`**

- `{ name: 1 }`.

**`gradeareas`**

- `{ grade_id: 1, area_id: 1 }` unico.
- `{ area_id: 1 }`.

**`groups`**

- `{ school_year_id: 1 }`.
- `{ grade_id: 1 }`.
- `{ school_year_id: 1, grade_id: 1 }`.
- `{ school_year_id: 1, grade_id: 1, name: 1 }` unico.

**`groupteachers`**

- `{ teacher_id: 1 }`.
- `{ group_id: 1 }`.
- `{ group_id: 1, area_id: 1 }`.
- `{ teacher_id: 1, group_id: 1, area_id: 1 }` unico.

**`aulas`**

- Sin indices adicionales declarados.

**`enrollments`**

- `{ student_id: 1 }`.
- `{ group_id: 1 }`.
- `{ school_year_id: 1 }`.
- `{ student_id: 1, school_year_id: 1 }` unico parcial para `status: "active"`.
- `{ group_id: 1, status: 1 }`.

#### Evaluacion

**`gradeitems`**

- `{ area_id: 1, period_id: 1 }`.
- `{ period_id: 1 }`.

**`studentgrades`**

- `{ student_id: 1 }`.
- `{ grade_item_id: 1 }`.
- `{ student_id: 1, grade_item_id: 1 }` unico.

**`periodarearesults`**

- `{ student_id: 1 }`.
- `{ student_id: 1, area_id: 1, period_id: 1 }` unico.
- `{ period_id: 1, area_id: 1 }`.

**`finalresults`**

- `{ student_id: 1, school_year_id: 1 }` unico.
- `{ school_year_id: 1, status: 1 }`.

#### Actividades

**`activities`**

- `{ teacher_id: 1, created_at: -1 }`.
- `{ group_id: 1, area_id: 1, period_id: 1 }`.
- `{ school_year_id: 1, group_id: 1, due_at: 1 }`.

**`activitysubmissions`**

- `{ activity_id: 1 }`.
- `{ student_id: 1, submitted_at: -1 }`.
- `{ activity_id: 1, student_id: 1 }` unico.

#### Notificaciones

**`notifications`**

- `{ recipient_user_id: 1 }`.
- `{ type: 1 }`.
- `{ audience_role: 1 }`.
- `{ read_at: 1 }`.
- `{ recipient_user_id: 1, created_at: -1 }`.
- `{ recipient_user_id: 1, read_at: 1, created_at: -1 }`.

### Justificacion tecnica de los indices

- Los indices unicos protegen reglas de identidad (`email`, documento, perfiles, resultados unicos).
- Los indices parciales resuelven restricciones de negocio sin castigar documentos nulos o historicos.
- Los indices compuestos estan alineados con las rutas de lectura mas comunes: grupos por ano, actividades por contexto, resultados por estudiante, bandeja de notificaciones.
- Los indices de soporte a filtros de estado (`status`, `read_at`, `is_active`) ayudan a lecturas administrativas y dashboards.

### Referencias vs embebidos

#### Referencias usadas

Se usan referencias cuando el dato:

- pertenece a otra entidad reutilizable
- necesita historico propio
- puede ser consultado desde multiples dominios
- requiere control de unicidad o trazabilidad

Ejemplos:

- `User -> Person`
- `Student -> User`
- `Teacher -> User`
- `Group -> Grade`, `SchoolYear`
- `Enrollment -> Student`, `Group`, `SchoolYear`
- `GradeItem -> Area`, `Period`
- `Activity -> Group`, `Area`, `Period`, `SchoolYear`, `Teacher`
- `Notification -> User`

#### Embebidos usados

Se usan embebidos cuando el dato forma parte natural del documento padre y no necesita vida propia:

- `Activity.rubric_criteria`
- `ActivitySubmission.rubric_scores`
- `Notification.metadata`

#### Razon del modelo hibrido

Este equilibrio evita joins innecesarios donde no aportan valor, pero conserva relaciones claras para los componentes centrales del dominio academico.

---

## Datos de prueba y seeds

### Script `yarn seed`

Archivo: `scripts/seed.js`

Objetivo:

- crear areas base
- crear 3 docentes demo
- crear 4 estudiantes demo
- crear usuarios y perfiles personales asociados

Datos base:

- **Docentes:** 3
- **Estudiantes:** 4
- **Areas:** 4
- **Password por defecto:** `EduConnect123!`

### Script `yarn seed:analytics`

Archivo: `scripts/seed-analytics-data.js`

Objetivo:

- poblar un ano escolar demo
- crear periodos, grados, areas y grupos
- asignar docentes a grupos y areas
- matricular estudiantes
- generar resultados por area/periodo
- generar resultados finales

Datos generados por defecto:

- **Ano escolar:** 1
- **Periodos:** 4
- **Grados:** 3
- **Areas:** 5
- **Grupos:** 6
- **Docentes:** 5
- **Estudiantes:** 48
- **Resultados por area/periodo:** 960
- **Resultados finales:** 48
- **Password por defecto:** `EduConnect123!`

Opciones CLI:

- `--year=YYYY`
- `--group-size=N`
- `--activate`

### Observaciones sobre el seed

- El seed usa `upsert`, por lo que es idempotente en varios escenarios.
- El dataset analitico esta pensado para dashboards y no reemplaza datos reales de operacion.
- La coleccion `notifications` no se puebla con estos scripts.

---

## Agregaciones y consultas analiticas

El proyecto no concentra toda la analitica en pipelines complejos de MongoDB; hoy combina:

- consultas indexadas con `find()`
- enriquecimiento con `populate()`
- calculos de negocio en servicios
- algunos `aggregate()` puntuales

### Agregaciones identificadas en el codigo

#### 1. Suma de porcentajes por area y periodo

En `EvaluationRepository`, `GradeItem.aggregate()` calcula el total acumulado de `percentage` por `period_id` y `area_id`. Esto se usa para impedir que los items de evaluacion superen el 100%.

#### 2. Listados administrativos de usuarios

En `UserRepository`, `User.aggregate()` usa:

- `$lookup` contra `people`
- `$lookup` contra `students`
- `$lookup` contra `teachers`
- `$addFields` para exponer `student_id` y `teacher_id`
- `$project` para ocultar `hash_password`
- `$count` para paginacion

Esto permite construir listados administrativos enriquecidos sin multiples llamadas desde el cliente.

### Endpoints analiticos apoyados por la base

La capa de servicios expone dashboards y endpoints agregados, entre ellos:

- `GET /api/analytics/admin/dashboard-summary`
- `GET /api/analytics/teacher/me/dashboard-summary`
- `GET /api/groups/:group_id/detail-summary`

En estos casos, gran parte del valor viene de:

- las referencias entre colecciones
- los indices de estado y contexto
- el dataset demo generado por `seed:analytics`

### Estado actual frente al repo de referencia

El repo de referencia esperaba un archivo `aggregations.js` con varias consultas. En este backend, la logica analitica esta repartida entre repositorios y servicios, no en un script Mongo aislado.

---

## Roles, seguridad y control de acceso

### Roles de negocio almacenados en base

Los roles del dominio viven en `people.role`:

- `Student`
- `Teacher`
- `Admin`
- `Parent`
- `Guardian`

Los estados de cuenta viven en `people.status`:

- `active`
- `inactive`
- `pending`
- `blocked`
- `egresado`

### Seguridad aplicada hoy

- **Autenticacion:** JWT.
- **Hash de contrasena:** `bcryptjs`.
- **Autorizacion por rol:** middleware `authorizeRoles`.
- **Autorizacion por estado:** validaciones en `AuthService` y servicios administrativos.
- **Ocultamiento de secreto:** `hash_password` no se expone en respuestas.

### Importante: no hay RBAC nativo de MongoDB en el repo

En el repositorio de referencia se esperaba un `roles.js` con `db.createRole()` y `db.grantRolesToUser()`. En **EduConnect Backend** esto no existe todavia. El control de acceso esta implementado a nivel de aplicacion, no a nivel del servidor MongoDB.

### Implicaciones

- Es suficiente para desarrollo y para una API centralizada.
- No protege la base si alguien accede directamente al motor con credenciales privilegiadas.
- Si el proyecto necesita endurecer seguridad, conviene agregar roles nativos de MongoDB y cuentas separadas por ambiente.

---

## Transacciones y consistencia

### Estado actual

Al 2026-03-13, el codigo **no implementa** `startSession()` ni `withTransaction()` de MongoDB. Esto marca una diferencia importante frente al repo de referencia, que exigia una transaccion explicita.

### Flujos multi-documento que hoy existen sin transaccion

#### 1. Completar perfil

Secuencia actual:

1. crear `Person`
2. actualizar `User.person_id`
3. crear perfil `Student` o `Teacher` segun el rol

Riesgo:

- si falla un paso intermedio, pueden quedar referencias incompletas

#### 2. Matricular estudiante

Secuencia actual:

1. validar estudiante, grupo, ano y capacidad
2. crear `Enrollment`
3. actualizar `Student.group_id`

Riesgo:

- si el paso 3 falla, la matricula historica existe pero el puntero de grupo actual queda desfasado

#### 3. Trasladar matricula

Secuencia actual:

1. cerrar matricula activa anterior
2. crear nueva matricula
3. actualizar `Student.group_id`

Riesgo:

- una falla en mitad del proceso puede dejar estados intermedios no deseados

### Recomendacion tecnica

Para acercarse al nivel esperado en la documentacion de referencia, seria recomendable:

- usar `mongoose.startSession()`
- envolver estos procesos en `withTransaction()`
- ejecutar MongoDB sobre replica set o Atlas para habilitar transacciones reales

---

## Conclusiones y mejoras posibles

### Conclusiones

- El backend tiene un modelo de datos amplio y bien separado por dominios.
- La combinacion de referencias, embebidos e indices esta alineada con el uso real de la API.
- Las reglas de negocio mas delicadas viven hoy en servicios, no solo en el schema.
- La base soporta autenticacion, operacion academica, evaluacion, actividades y notificaciones sin depender de estructuras ad hoc.

### Mejoras posibles

1. Agregar validadores nativos de MongoDB con `db.createCollection(..., { validator: { $jsonSchema: ... } })`.
2. Incorporar transacciones reales en flujos multi-documento.
3. Implementar RBAC nativo de MongoDB para ambientes productivos.
4. Revisar si `students.group_id` y `teachers.area` deben seguir como campos de apoyo o moverse totalmente a relaciones historicas.
5. Evaluar indices adicionales segun crecimiento real de dashboards y filtros de reportes.
6. Versionar scripts de inicializacion de base dentro de `database/` para que el esquema no dependa solo del arranque de la app.

---

## Referencias

- Repositorio de referencia de formato documental: `https://github.com/Duran24062005/Proyecto_MongoDB2_S2_DuranAlexi_MantillaEsteban`
- Backend principal: `../README.md`
- Guia interna de base de datos: `../docs/database_docs.md`
- Conexion y configuracion: `../src/config/config.js`
- Modelos de Mongoose: `../src/models/`
- Seeds de desarrollo: `../scripts/seed.js`, `../scripts/seed-analytics-data.js`
- Reglas de negocio clave: `../src/services/AcademicService.js`, `../src/services/GroupService.js`, `../src/services/EvaluationService.js`, `../src/services/ActivityService.js`, `../src/services/NotificationService.js`
