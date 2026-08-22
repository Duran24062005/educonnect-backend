# PRD 023 - Asistencia del piloto

## Estado

Primera slice implementada: sesiones de asistencia por grupo, estados por estudiante, justificaciones, cierre de sesión, consulta por estudiante y consulta agregada para acudientes.

## Alcance implementado

- `AttendanceSession` relaciona año, periodo opcional, grupo, área, docente y fecha.
- `AttendanceRecord` mantiene un registro por estudiante y sesión con estados `pending`, `present`, `absent`, `late` y `excused`.
- Administración puede crear, consultar, cerrar y reabrir sesiones.
- Un docente solo puede operar grupos en los que tiene asignación y únicamente su propio perfil docente.
- La sesión se inicializa con los estudiantes de la matrícula activa del grupo.
- Las justificaciones requieren texto y quedan auditadas con actor y fecha.
- Un estudiante, docente, admin o acudiente puede consultar el resumen permitido por relación de acceso.
- `GET /api/guardians/me/attendance?school_year_id=...` devuelve la asistencia de todos los estudiantes autorizados.

## Reglas

- La fecha debe pertenecer al año escolar y, si se envía periodo, debe estar dentro de su rango.
- No se permite registrar asistencia para un estudiante que no tenga matrícula activa en el grupo de la sesión.
- Una sesión cerrada solo puede ser modificada por administración.
- El promedio de asistencia considera presentes, tardanzas y justificaciones como asistencia; los pendientes no entran al porcentaje.
- Las consultas de estudiante pasan por la misma validación de institución, matrícula, docente o vínculo de acudiente que el resto de datos académicos.

## Fuera de esta slice

- Flujos de aprobación institucional de justificaciones.
- Notificaciones automáticas por inasistencia.
- Reportes institucionales de otros dominios y jobs programados.
- Integración automática con sesiones del calendario.

## Siguiente integración

La pantalla operativa del portal debe permitir seleccionar grupo y fecha, cargar la lista de estudiantes, marcar estados, justificar y cerrar la sesión. El portal de acudiente debe mostrar el resumen por cada estudiante vinculado.

## Corte de reporte

El reporte institucional de asistencia ya esta disponible en JSON y CSV para administracion, con filtros por ano, grupo y rango de fechas. La exportacion no reemplaza los flujos pendientes de aprobacion de justificaciones, notificaciones automaticas ni integracion con calendario.
