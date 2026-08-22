# 013 - Calendario de clases y sesiones académicas

## Estado

Fase demo y primera integracion persistente implementadas. El portal puede seleccionar el proveedor API mediante `VITE_CALENDAR_DATA_SOURCE=api` y consume el catalogo, consultas y mutaciones de `educonnect-backend`. La validacion con datos institucionales, tenant activo y operacion de staging permanece pendiente.

Este PRD conserva el contrato funcional que debe usarse al implementar la segunda fase.

## Objetivo

Agregar un calendario académico para consultar y administrar las sesiones de clase de EduConnect.

El calendario debe permitir que:

- `student` consulte su próxima clase y sus siguientes sesiones.
- `student` identifique docente, materia, tema, horario y actividades pendientes relacionadas con sus clases.
- `teacher` consulte sus sesiones y conozca grupo, aula, materia, tema y horario.
- `teacher` cree o modifique las sesiones que administra según sus asignaciones.
- `admin` consulte todas las sesiones, filtre como mínimo por grado y pueda crearlas, modificarlas o cancelarlas.
- la primera versión funcione con datos demo en el frontend y pueda cambiar al backend sin rehacer la pantalla ni sus reglas de presentación.

## Resultado de la planeación

Se propone separar tres conceptos:

1. **Sesión de clase**: una clase programada con fecha, hora, grupo, área, docente, aula y tema.
2. **Actividad académica**: el recurso que ya existe en EduConnect y tiene apertura, fecha límite y entregas.
3. **Vista de calendario**: la composición de sesiones visibles para el usuario con un resumen de actividades pendientes.

La sesión no duplicará los datos de una actividad. En la primera versión, las actividades pendientes se relacionan por `group_id + area_id` y se muestran en el detalle de la sesión. Una relación directa `activity.session_id` queda como posible evolución si se necesita distinguir qué actividad corresponde a una clase específica.

La primera versión persistirá sesiones concretas. No se define todavía un motor de recurrencia semanal, porque esa decisión afecta creación masiva, edición de una instancia frente a toda una serie, excepciones y conflictos.

## Alcance

### Primera fase: demo funcional en `educonnect-portal`

- Nueva ruta privada `/calendar` para los tres roles actuales.
- Datos demo tipados, representativos de varios grados, grupos, docentes, materias, aulas y actividades.
- Vista semanal como vista operativa principal.
- Vista agenda/lista para móvil y para lectura rápida.
- Cambio de semana y navegación a la fecha actual.
- Filtros visibles según rol:
  - `admin`: año escolar, grado, grupo, materia, docente y aula.
  - `teacher`: grupo, materia y estado de sesión.
  - `student`: no filtra por entidades ajenas; puede cambiar semana y ver pendientes.
- Detalle de sesión con inicio y fin, materia/área, tema, docente, grupo, aula y actividades pendientes.
- Tarjeta de “Próxima clase” en el dashboard del estudiante.
- Acciones demo de crear, editar y cancelar sesiones para probar el flujo de administración.
- Adaptador de datos único para alternar entre `demo` y `api` cuando exista el backend.

### Segunda fase: API y persistencia

- [x] Modelo persistido de sesiones.
- [x] Consultas por rango de fechas y alcance del usuario.
- [x] Creación, edición, cancelación y reactivación con validación de permisos.
- [x] Cálculo real de actividades pendientes usando `Activity` y `ActivitySubmission`.
- [x] Validación de conflictos de docente, grupo y aula.
- [x] Integración del portal mediante el mismo contrato definido en este documento.
- [ ] Validación de tenant, backup y datos institucionales en staging.

## Fuera de alcance inicial

- Asistencia, conexión a videollamada o control de presencia.
- Sincronización con Google Calendar, Outlook u otros calendarios externos.
- Calendario institucional de festivos, reuniones, eventos y días sin clase.
- Portal de padres/acudientes.
- Notificaciones push, email, SMS o WhatsApp.
- Edición masiva de una serie recurrente.
- Reglas de sustitución de docentes o reserva avanzada de recursos.
- Modificación del contenido, rúbrica o fecha límite de una actividad desde el calendario; esas acciones siguen en el módulo de actividades.

## Repositorios impactados

Esta iniciativa cruza dos repositorios independientes:

- `educonnect-portal`: ruta, vistas, adaptador demo/API, tipos de respuesta, filtros y formularios.
- `educonnect-backend`: modelo de sesión, reglas de acceso, consultas, validadores, endpoints, índices y pruebas.

Este PRD vive en `educonnect-backend/prds` porque define un contrato y reglas de dominio. Cuando se implemente el portal, se debe actualizar `educonnect-portal/docs/frontend/README.md` y agregar una nota de integración en su documentación de módulos.

## Actores y permisos

### Estudiante

Puede consultar únicamente las sesiones del grupo en el que tiene matrícula activa para el año escolar seleccionado. No puede crear, editar ni cancelar sesiones.

Puede ver actividades de su grupo y área que estén publicadas y que aún requieran una entrega. El estado visual recomendado es:

- `pending`: fecha límite futura y entrega no registrada.
- `overdue`: fecha límite pasada y entrega no registrada.
- `submitted`: entrega registrada; no se presenta como pendiente, pero puede aparecer en el detalle histórico si se requiere.

### Docente

Puede consultar las sesiones asociadas a sus asignaciones `group + area` vigentes.

Puede crear, editar o cancelar sesiones de esas asignaciones. En la primera versión no puede cambiar el docente responsable ni asociar una materia o grupo que no tenga asignado. La posibilidad de modificar hora, aula y grupo se debe confirmar antes de implementar, porque afecta conflictos y responsabilidades.

### Administrador

Puede consultar todas las sesiones del año escolar y rango solicitado.

Puede filtrar por grado como mínimo y, de forma complementaria, por grupo, materia, docente y aula. Puede crear, editar y cancelar cualquier sesión. Las acciones administrativas deben quedar preparadas para auditoría aunque el `AuditLog` formal todavía no exista.

### Guardian/Parent

No se incluye en esta fase. El rol existe en el dominio, pero no tiene portal funcional ni relación estudiante-acudiente implementada.

## Casos de uso principales

### 1. Estudiante consulta su próxima clase

1. El estudiante entra a `/calendar` o al dashboard.
2. El sistema ordena sus sesiones futuras por `start_at`.
3. Se muestra la primera sesión no cancelada con fecha, hora, materia, docente, aula, grupo y tema.
4. Se muestra el resumen de actividades pendientes de esa materia y grupo.
5. Al abrir la sesión, el estudiante puede navegar al detalle de una actividad existente.

Si no existen sesiones futuras, la interfaz debe mostrar un estado vacío claro y las actividades pendientes que todavía tengan fecha límite.

### 2. Docente consulta y modifica su agenda

1. El docente abre `/calendar`.
2. El sistema carga sus sesiones dentro del rango visible.
3. El docente cambia entre semana y agenda.
4. Desde una sesión autorizada abre el formulario de edición.
5. El sistema valida la asignación `teacher + group + area` y los conflictos de horario.
6. La sesión actualizada aparece inmediatamente en la vista y conserva sus identificadores de dominio.

### 3. Administrador filtra el calendario por grado

1. El administrador abre `/calendar`.
2. Selecciona año escolar y grado.
3. El calendario muestra únicamente las sesiones de grupos pertenecientes al grado seleccionado.
4. Puede abrir el detalle de cualquier sesión y modificarla.
5. Al cancelar una sesión, esta permanece visible como cancelada y no se elimina físicamente de la consulta histórica.

### 4. Usuario crea una sesión

El formulario debe pedir como mínimo fecha, hora de inicio, hora de finalización, grupo, materia/área, docente, aula y tema de la sesión.

El formulario debe filtrar las opciones dependientes: el docente debe corresponder a la asignación del grupo y el área debe ser válida para el grado del grupo.

## Diseño funcional del portal

### Estructura de la pantalla

- Encabezado con título “Calendario” y selector de año escolar.
- Barra de navegación temporal: fecha actual, anterior, siguiente y selector de fecha.
- Selector de vista: `Semana` y `Agenda`.
- Barra de filtros según el rol.
- Área principal con las sesiones.
- Panel o diálogo de detalle de sesión.
- Acción de crear visible solo para roles autorizados.

En escritorio, la vista semanal puede usar una cuadrícula por día y franjas horarias. En móvil debe degradar a una agenda ordenada por día; no se debe forzar una cuadrícula horizontal ilegible.

Las sesiones deben tener una altura estable y mostrar como mínimo materia y hora. El resto de información se consulta en el detalle para evitar superposición de texto.

### Indicadores visuales

- Color o etiqueta por materia, manteniendo contraste suficiente y una leyenda accesible.
- Estado `cancelled` con tratamiento visual distinto y sin ocultar el registro.
- Indicador de actividades pendientes en la sesión.
- Indicador de conflicto o error únicamente en formularios administrativos; no se debe presentar un calendario demo con conflictos silenciosos.

### Estados de interfaz

- cargando;
- sin sesiones para el rango/filtro seleccionado;
- error de carga;
- sesión creada/actualizada/cancelada;
- permisos insuficientes;
- formulario con conflicto de horario;
- actividad pendiente, vencida o entregada.

## Contrato funcional propuesto

### Modelo canónico de sesión

El frontend debe trabajar con un contrato estable, independientemente de si la fuente es fixture o API:

```json
{
  "id": "session-001",
  "type": "class_session",
  "start_at": "2026-08-24T13:00:00.000Z",
  "end_at": "2026-08-24T14:00:00.000Z",
  "status": "scheduled",
  "school_year": { "id": "year-2026", "year": 2026 },
  "grade": { "id": "grade-7", "name": "7" },
  "group": { "id": "group-7a", "name": "7A" },
  "area": { "id": "area-math", "name": "Matemáticas" },
  "teacher": { "id": "teacher-001", "name": "Daniel Vargas" },
  "aula": { "id": "aula-201", "name": "Aula 201" },
  "topic": "Ecuaciones lineales",
  "pending_activities": [
    {
      "id": "activity-001",
      "title": "Taller de ecuaciones",
      "due_at": "2026-08-26T23:59:59.000Z",
      "status": "pending"
    }
  ]
}
```

Los nombres y fechas son un ejemplo de contrato, no datos que deban copiarse literalmente al seed final.

### Consultas

Se propone una consulta común para el portal:

- `GET /api/calendar/me?from=2026-08-24&to=2026-08-30&school_year_id=...` para `student` y `teacher`.
- `GET /api/calendar?from=...&to=...&school_year_id=...&grade_id=...&group_id=...&area_id=...&teacher_id=...&aula_id=...` para `admin`.

Respuesta mínima:

```json
{
  "data": {
    "sessions": [],
    "pending_activities": [],
    "range": {
      "from": "2026-08-24",
      "to": "2026-08-30"
    }
  }
}
```

`pending_activities` puede repetirse también dentro de la sesión para facilitar el detalle. Si se decide evitar duplicación, el backend debe entregar un identificador de actividad y el frontend debe resolver la relación de forma determinista.

### Mutaciones

- `POST /api/calendar/sessions`
- `PATCH /api/calendar/sessions/:id`
- `DELETE /api/calendar/sessions/:id` solo si se decide eliminación física; la recomendación es usar cancelación.

### Catálogo para formularios

- `GET /api/calendar/catalog?school_year_id=...`

La respuesta entrega `years`, `grades`, `groups`, `areas`, `teachers` y `aulas` limitados por rol y año escolar. El portal usa este endpoint para dejar de depender de identificadores demo al crear o editar una sesión.

Payload mínimo de creación/edición:

```json
{
  "school_year_id": "...",
  "group_id": "...",
  "area_id": "...",
  "teacher_id": "...",
  "aula_id": "...",
  "start_at": "2026-08-24T13:00:00.000Z",
  "end_at": "2026-08-24T14:00:00.000Z",
  "topic": "Ecuaciones lineales"
}
```

La API debe devolver la sesión normalizada con los nombres relacionados que el calendario necesita renderizar, evitando que el frontend tenga que hacer una petición por cada tarjeta.

## Datos y persistencia futura

Se propone un modelo `ClassSession` con estos campos: `school_year_id`, `group_id`, `area_id`, `teacher_id`, `aula_id`, `start_at`, `end_at`, `topic`, `status`, `created_by`, `updated_by` y timestamps.

Índices iniciales sugeridos:

- `{ school_year_id: 1, start_at: 1 }`;
- `{ group_id: 1, start_at: 1 }`;
- `{ teacher_id: 1, start_at: 1 }`;
- `{ aula_id: 1, start_at: 1 }`.

La sesión debe verificar que grupo, área, docente, aula y año escolar existan y sean compatibles. La relación con `Activity` inicialmente se resuelve mediante `group_id`, `area_id`, año escolar y rango de fechas.

## Validaciones y reglas de negocio

- `end_at` debe ser posterior a `start_at`.
- `start_at` y `end_at` deben ser fechas ISO válidas.
- La sesión debe pertenecer al año escolar indicado.
- El grupo debe pertenecer al año escolar indicado.
- El área debe estar configurada para el grado del grupo.
- El docente debe tener asignación vigente al grupo y al área.
- El aula debe existir y estar disponible para la institución.
- El estudiante solo recibe sesiones de su matrícula activa.
- El docente solo modifica sesiones dentro de su alcance.
- Una sesión cancelada no se muestra como próxima clase.
- Una sesión cancelada puede volver a `scheduled` mediante una acción explícita de reactivación ejecutada por `admin` o por el `teacher` autorizado para esa sesión.
- Reactivar una sesión conserva fecha, horario, grupo, materia, docente, aula, tema y actividades relacionadas.
- Se debe detectar al menos conflicto de docente, grupo y aula cuando dos sesiones se solapan.
- La zona horaria de almacenamiento debe ser UTC y la presentación debe usar la zona horaria institucional configurada. Mientras no exista entidad de institución, la demo usará `America/Bogota`.
- Las mutaciones deben ser idempotentes desde el punto de vista de la interfaz: después de guardar, el calendario debe actualizar el rango visible sin duplicar la sesión.

## Estrategia demo/API

En `educonnect-portal` se propone una interfaz de proveedor equivalente a:

```ts
type CalendarDataSource = {
  list(params: CalendarQuery): Promise<CalendarResponse>;
  create(input: CalendarSessionInput): Promise<CalendarSession>;
  update(id: string, input: CalendarSessionInput): Promise<CalendarSession>;
  cancel(id: string): Promise<CalendarSession>;
};
```

La implementación demo usará fixtures y estado local para permitir navegación y edición durante la validación UX. La implementación API usará Axios y conservará los mismos tipos normalizados.

La selección del proveedor debe ser explícita mediante configuración, por ejemplo `VITE_CALENDAR_DATA_SOURCE=demo|api`, con `demo` como valor local inicial. El componente de calendario no debe conocer Axios, nombres de modelos MongoDB ni la forma de respuesta cruda del backend.

## Criterios de aceptación

- Un estudiante puede abrir `/calendar` y ver solamente sus clases demo.
- El estudiante puede identificar su próxima clase sin recorrer toda la semana.
- Cada detalle de sesión muestra inicio, fin, materia, tema y docente; también muestra grupo y aula cuando estén disponibles.
- Las actividades pendientes aparecen asociadas al grupo y materia correctos, con fecha límite y estado.
- Un docente puede ver sus sesiones demo y abrir el formulario de edición de una sesión autorizada.
- Un docente no puede editar una sesión fuera de sus grupos/áreas asignados.
- Un administrador puede filtrar por grado y ver únicamente las sesiones resultantes.
- Un administrador puede crear, editar y cancelar una sesión demo.
- El calendario funciona en vista semanal de escritorio y agenda en móvil sin solapamiento de texto.
- El cambio de proveedor demo a API no exige cambiar los componentes visuales ni las reglas de presentación.
- Las sesiones canceladas no se cuentan como próxima clase y permanecen identificables en el histórico del rango.
- Un administrador o docente autorizado puede reactivar una sesión cancelada y esta vuelve a aparecer como programada.
- Los errores de conflicto y permisos se muestran de forma accionable.

## Pruebas requeridas para la implementación

### Frontend demo

- normalización del contrato canónico;
- filtrado por rol y grado;
- cálculo de próxima sesión ignorando canceladas;
- clasificación de actividades pendientes/vencidas/entregadas;
- creación, edición y cancelación en el proveedor demo;
- render de estados vacíos, carga, error y permisos;
- prueba responsive o de layout para evitar desbordamiento en agenda móvil.

### Backend

- consulta por rango para estudiante, docente y admin;
- autorización por matrícula y asignación docente;
- filtros administrativos;
- validación de compatibilidad grupo/área/docente/año;
- conflictos de docente, grupo y aula;
- cancelación y exclusión de la próxima clase;
- integración con actividades y entregas pendientes.

## Riesgos

- Sin recurrencia, cargar manualmente todas las sesiones puede ser costoso para un horario escolar real.
- Si una actividad no se enlaza directamente a una sesión, el usuario puede interpretar que aplica a una clase incorrecta cuando hay varias sesiones de la misma materia en una semana.
- El modelo actual no tiene institución, sede ni jornada; aulas y horarios no están aislados por esos conceptos.
- El modelo actual no tiene auditoría formal para cambios de horario, aula o tema.
- Las inconsistencias existentes entre perfiles, matrículas y asignaciones pueden producir filtros incompletos si no se corrigen o encapsulan en el servicio de calendario.
- El uso de hora local sin una política explícita puede desplazar sesiones al cambiar de navegador o entorno.

## Preguntas abiertas para cerrar antes de implementar

1. ¿El calendario debe manejar un horario semanal recurrente, o en la primera versión se registrarán sesiones concretas por fecha? La recomendación para el demo es usar sesiones concretas y dejar la recurrencia para una segunda decisión.
2. ¿Qué campos puede modificar un docente: solo tema y aula, o también fecha y horas? La propuesta actual permite editar sesiones propias, pero bloquea cambiar docente, grupo o materia fuera de sus asignaciones.
3. ¿Una actividad pendiente debe aparecer solo por grupo y materia, como en esta propuesta, o debe estar vinculada a una sesión específica mediante `session_id`?
4. ¿El administrador necesita únicamente filtro por grado o también filtros obligatorios por grupo, docente, materia y aula? Se dejaron previstos como filtros complementarios.
5. ¿Cancelar una clase es suficiente o se requiere eliminarla físicamente? La recomendación es conservarla como `cancelled` para mantener trazabilidad.
6. ¿El calendario incluirá después eventos no académicos, como reuniones, festivos y actividades institucionales, o permanecerá limitado a clases?
