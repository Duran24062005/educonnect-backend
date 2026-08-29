# Plan de implementación: horario semanal y notificaciones

> Este documento describe el corte de compatibilidad inicial. El diseño canónico vigente está documentado en [scheduling-domain-redesign.md](./scheduling-domain-redesign.md): `TeachingAssignment → ScheduleEntry → ClassSession → LessonPlan`.

## Problema y objetivo

El contrato de horarios actualmente expone ventanas generales por grupo. Se necesita persistir clases concretas por día y hora para que cada curso pueda tener una configuración semanal distinta. El portal también moverá los formularios de anuncios a modales, sin cambiar el contrato de notificaciones.

## Alcance del backend

- conservar `WeeklySchedule.slots` únicamente como formato legacy mientras se migran a `ScheduleEntry`;
- materializar `ClassSession` al publicar un horario, sin creación manual por parte de docentes;
- aceptar y serializar slots en `PATCH /api/calendar/schedules/:id`;
- validar referencias, pertenencia al año, asignación grupo-materia-docente, aula, días lectivos, jornada y conflictos;
- hacer que la autorización de sesiones use el slot exacto cuando el horario publicado los tenga;
- mantener compatibilidad con `availability_windows` para horarios existentes;
- actualizar Swagger, documentación y pruebas del contrato.

## Contrato

El payload de actualización conserva `school_days` y `availability_windows`, y agrega:

```json
{
  "slots": [
    {
      "slot_id": "lunes-ingles-0615",
      "group_id": "...",
      "area_id": "...",
      "teacher_id": "...",
      "aula_id": "...",
      "weekday": 1,
      "start_time": "06:15",
      "end_time": "08:15"
    }
  ]
}
```

La respuesta de horarios incluye `slots` normalizados con las entidades `group`, `area`, `teacher` y `aula`.

## Reglas de negocio

- `start_time` debe ser anterior a `end_time`.
- `weekday` debe estar dentro de `school_days`.
- El slot debe pertenecer al año escolar del horario.
- La materia debe estar configurada para el grado del grupo.
- El docente debe tener la asignación del grupo y materia.
- El aula debe existir.
- El slot debe estar dentro de la jornada activa del grupo.
- No puede existir solapamiento para el mismo grupo, docente o aula en el mismo día.
- Si existen slots publicados, una sesión de origen `schedule` debe coincidir con grupo, materia, docente, día y rango de un slot. Si no existen slots, se conserva la validación por ventana.

## Compatibilidad y riesgos

Los horarios publicados antes de este cambio solo contienen ventanas y continúan autorizando sesiones dentro de esas ventanas. Los slots se copian al crear un borrador desde un horario publicado para que una nueva versión no pierda la configuración detallada.

## Validación

- pruebas de integración para guardar y publicar slots válidos;
- pruebas de rechazo por solapamiento, fuera de jornada y asignación inválida;
- regresión del flujo existente de ventanas y sesiones calendarizadas;
- compilación y suite de calidad del portal.
