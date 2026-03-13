# 010 - Notifications & Announcements

## Objetivo

Implementar una primera versión de notificaciones persistidas dentro del portal, visibles solo `in-app`, con estado de lectura por usuario y capacidad de emitir avisos manuales dirigidos por rol o alcance académico.

La meta de esta fase es cubrir tres necesidades principales:

- notificar a estudiantes cuando un docente crea una actividad para su grupo
- notificar al docente creador cuando un estudiante entrega una actividad
- permitir que `admin` y `teacher` emitan avisos manuales a audiencias específicas

## Alcance

Esta versión cubre:

- persistencia de notificaciones en backend
- consulta de notificaciones propias del usuario autenticado
- conteo de no leídas
- marcar una notificación como leída
- marcar todas las notificaciones como leídas
- disparadores automáticos ligados a actividades
- avisos manuales emitidos por `admin`
- avisos manuales emitidos por `teacher`
- visualización en campana y bandeja del portal

## Repositorios impactados

Esta iniciativa cruza dos repositorios independientes:

- En `educonnect-backend` se documentan el modelo, los endpoints, las reglas de targeting y los disparadores automáticos.
- En `educonnect-portal` se documentan la bandeja, el badge, los formularios de avisos y el consumo de los endpoints.

Este PRD vive en el backend porque introduce contratos HTTP nuevos y lógica de dominio adicional.

## Fuera de alcance

Esta primera versión no incluye:

- email
- push notifications
- WebSockets o tiempo real
- padres o acudientes como destinatarios
- archivado de notificaciones
- preferencias personalizadas de notificación por usuario
- targeting por grado completo fuera del concepto operativo de grupos actuales
- plantillas avanzadas de mensajería

## Actores cubiertos

- `admin`
- `teacher`
- `student`

## Casos de uso principales

### 1. Actividad creada por docente

Cuando un docente crea una actividad:

- el sistema identifica el grupo y el área de la actividad
- el sistema obtiene los estudiantes con matrícula activa en ese grupo
- se crea una notificación para cada estudiante destinatario

La notificación debe incluir:

- nombre de la actividad
- nombre del grupo
- nombre de la materia/área
- fecha límite de entrega

### 2. Actividad entregada por estudiante

Cuando un estudiante entrega una actividad:

- el sistema identifica al docente creador de esa actividad
- el sistema crea una notificación para ese docente

La notificación debe incluir:

- nombre del estudiante
- nombre de la actividad
- materia/área
- grupo
- fecha y hora exacta de entrega

Regla explícita de esta v1:

- la notificación llega solo al docente creador de la actividad

### 3. Avisos manuales emitidos por admin

`admin` puede crear avisos manuales y elegir a qué rol llegan:

- solo `admin`
- solo `teacher`
- solo `student`
- `teacher + student`
- `teacher + admin`
- todos (`admin + teacher + student`)

Cada aviso debe generar una notificación individual por destinatario real.

### 4. Avisos manuales emitidos por teacher

`teacher` puede crear avisos manuales con dos alcances:

- a un grupo específico donde tenga asignación docente vigente
- a todos sus estudiantes

En esta v1, el targeting académico del docente se resuelve sobre grupos y matrículas activas, no sobre una abstracción nueva de grado completo.

## Modelo de datos esperado

Se debe introducir una entidad de notificación persistida.

Campos mínimos esperados:

- `recipient_user_id`
- `type`
- `title`
- `message`
- `audience_role`
- `read_at`
- `created_by_user_id`
- `created_by_role`
- `source_type`
- `source_id`
- `metadata`
- `created_at`
- `updated_at`

## Tipos de notificación

Tipos mínimos de esta fase:

- `activity_created`
- `activity_submitted`
- `admin_announcement`
- `teacher_announcement`

## Metadatos mínimos por tipo

### activity_created

- `activity_id`
- `activity_title`
- `group_id`
- `group_name`
- `area_id`
- `area_name`
- `due_at`

### activity_submitted

- `activity_id`
- `activity_title`
- `student_id`
- `student_name`
- `submitted_at`
- `group_id`
- `group_name`
- `area_id`
- `area_name`

### admin_announcement / teacher_announcement

- `scope`
- `target_role` cuando aplique
- `group_id` cuando aplique
- `group_name` cuando aplique

## Endpoints nuevos esperados

### Lectura de notificaciones propias

- `GET /api/notifications/me`
- `GET /api/notifications/me/unread-count`

### Acciones de lectura

- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/me/read-all`

### Emisión de avisos manuales

- `POST /api/notifications/admin/announcements`
- `POST /api/notifications/teacher/announcements`

## Contratos funcionales esperados

### GET /api/notifications/me

Debe devolver notificaciones del usuario autenticado:

- ordenadas de más reciente a más antigua
- con posibilidad de filtrar por leídas/no leídas si se implementa como query param
- listas para renderizar en la campana del portal

Cada ítem debe incluir al menos:

- `id`
- `type`
- `title`
- `message`
- `is_read`
- `read_at`
- `created_at`
- `source_type`
- `source_id`
- `metadata`
- `created_by`

### GET /api/notifications/me/unread-count

Debe devolver:

- cantidad actual de notificaciones no leídas del usuario autenticado

### PATCH /api/notifications/:id/read

Debe:

- marcar una sola notificación como leída
- rechazar intentos de modificar notificaciones ajenas

### PATCH /api/notifications/me/read-all

Debe:

- marcar como leídas todas las notificaciones del usuario autenticado

### POST /api/notifications/admin/announcements

Payload esperado:

```json
{
  "title": "Recordatorio institucional",
  "message": "Mañana hay reunión general.",
  "target_role": "teacher"
}
```

Valores permitidos en esta v1:

- `admin`
- `teacher`
- `student`
- `teacher_student`
- `teacher_admin`
- `all`

### POST /api/notifications/teacher/announcements

Payload esperado:

Caso todos mis estudiantes:

```json
{
  "title": "Entrega pendiente",
  "message": "Revisen la actividad antes de las 6:00 p.m.",
  "scope": "all_my_students"
}
```

Caso grupo específico:

```json
{
  "title": "Material complementario",
  "message": "Recuerden revisar el recurso adicional.",
  "scope": "group",
  "group_id": "..."
}
```

## Reglas de permisos

- Todas las rutas requieren autenticación.
- Consultar y marcar notificaciones propias aplica a cualquier usuario autenticado.
- `admin` puede emitir anuncios administrativos.
- `teacher` puede emitir anuncios docentes.
- `student` no puede emitir anuncios en esta fase.

## Reglas de targeting

### Reglas para admin

Si `target_role=admin`:

- notificar a admins activos

Si `target_role=teacher`:

- notificar a docentes activos

Si `target_role=student`:

- notificar a estudiantes activos

Si `target_role=teacher_student`:

- notificar a docentes activos y estudiantes activos

Si `target_role=teacher_admin`:

- notificar a docentes activos y admins activos

Si `target_role=all`:

- notificar a admins activos, docentes activos y estudiantes activos

### Reglas para teacher

Si `scope=group`:

- el docente solo puede usar grupos donde tenga asignación vigente
- los destinatarios reales son estudiantes con matrícula activa en ese grupo

Si `scope=all_my_students`:

- el sistema reúne todos los grupos donde el docente tenga asignación
- el sistema reúne estudiantes activos de esos grupos
- el sistema deduplica por usuario destinatario

## Reglas de negocio

- una notificación pertenece a un solo destinatario final
- los anuncios masivos se materializan como múltiples registros individuales
- no se deben crear notificaciones para usuarios inactivos, bloqueados o fuera del alcance efectivo
- si una operación no tiene destinatarios válidos, debe rechazarse o responder explícitamente que no hubo destinatarios efectivos
- no se debe permitir que un docente anuncie sobre grupos que no le pertenecen funcionalmente
- la marca de lectura es individual por usuario
- las notificaciones deben mantenerse disponibles como historial

## Integración con actividades

Los disparadores automáticos se integran en estos puntos del dominio:

- creación de actividad docente
- entrega de actividad por estudiante

La creación de notificaciones debe ocurrir como parte del flujo de negocio del caso de uso correspondiente.

Condición importante:

- si falla la operación principal, no debe quedar notificación huérfana

## Comportamiento esperado en frontend

El portal debe incorporar esta funcionalidad sobre la campana ya presente en el layout autenticado.

### Bandeja de notificaciones

Debe permitir:

- ver historial reciente
- distinguir visualmente leídas y no leídas
- mostrar badge con conteo pendiente
- marcar una como leída
- marcar todas como leídas

### Contenido visual mínimo

Actividad creada:

- título o nombre de la actividad
- materia
- grupo
- fecha límite

Actividad entregada:

- estudiante
- actividad
- materia
- fecha y hora de entrega

Aviso manual:

- remitente
- título
- mensaje
- alcance aplicado

### Formularios manuales

`admin`:

- formulario con `title`
- `message`
- `target_role`

`teacher`:

- formulario con `title`
- `message`
- `scope`
- `group_id` cuando el alcance sea por grupo

## Criterios de aceptación

- crear una actividad genera notificaciones para los estudiantes activos del grupo correcto
- estudiantes de otros grupos no reciben la notificación
- entregar una actividad genera notificación solo al docente creador
- el docente recibe fecha y hora de entrega en la notificación
- `admin` puede enviar anuncios a un único rol por operación
- `teacher` puede enviar anuncios a un grupo propio o a todos sus estudiantes
- un docente no puede emitir anuncios para grupos ajenos
- el usuario autenticado puede listar sus notificaciones
- el usuario autenticado puede ver cuántas tiene no leídas
- el usuario autenticado puede marcar una como leída
- el usuario autenticado puede marcar todas como leídas
- la campana del frontend refleja el conteo de no leídas
- la bandeja diferencia visualmente estados de lectura

## Escenarios de prueba

### Backend

- creación de actividad con estudiantes activos en el grupo
- creación de actividad en grupo sin estudiantes activos
- entrega válida por estudiante
- intento de marcar como leída una notificación ajena
- anuncio admin dirigido a `teacher`
- anuncio admin dirigido a `student`
- anuncio teacher por grupo propio
- intento de anuncio teacher sobre grupo no asignado
- anuncio teacher a todos sus estudiantes con deduplicación correcta

### Frontend

- mostrar badge cuando hay pendientes
- abrir bandeja y listar de más reciente a más antigua
- marcar una notificación y actualizar estado visual
- marcar todas y limpiar badge
- mostrar datos de materia en notificación de actividad creada
- mostrar fecha/hora en notificación de entrega
- validación visual de formularios de anuncio

## Riesgos y observaciones

- el modelo genera una fila por destinatario, por lo que anuncios amplios aumentan volumen de escritura
- sin tiempo real ni WebSockets, la frescura depende del patron de refetch del frontend
- el targeting docente en esta versión depende de asignaciones y matrículas activas; cualquier inconsistencia de datos afectará destinatarios
- si más adelante se requiere targeting por grado completo o acudientes, convendrá extender el modelo y no sobrecargar esta primera versión

## Resultado esperado

Esta fase debe dejar lista una base funcional de notificaciones dentro del producto:

- útil para eventos académicos críticos
- consistente con los roles actuales del sistema
- extensible para futuras iteraciones
- desacoplada de email y tiempo real para reducir complejidad inicial
