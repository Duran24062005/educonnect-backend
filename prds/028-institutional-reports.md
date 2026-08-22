# PRD 028 - Reportes institucionales

## Estado

- Estado: primera slice implementada para asistencia
- Dependencia: PRD 014 y PRD 023

## Problema y objetivo

La institucion necesita consultar resultados operativos sin reconstruirlos manualmente desde sesiones individuales. El primer reporte cubre asistencia porque es un proceso diario del piloto y debe poder revisarse por ano, grupo y rango de fechas.

## Alcance implementado

- Reporte JSON administrativo en /api/attendance/reports.
- Exportacion CSV administrativa en /api/attendance/reports.csv.
- Exportacion CSV del padron de matriculas en /api/groups/reports/enrollments.csv, con grupo, grado, sede y jornada.
- Filtros por ano escolar obligatorio, grupo opcional y fechas inicial/final opcionales.
- Resumen de sesiones y estados pendiente, presente, ausente, tarde y justificada.
- Filas con fecha, grupo, grado, area, tema, estudiante, estado, nota y justificacion.
- Boton Exportar CSV en las pantallas administrativas de asistencia y matriculas.

## Reglas y permisos

- Solo admin puede consultar o descargar el reporte institucional.
- El contexto tenant limita sesiones y registros cuando la barrera esta activa.
- El reporte no reemplaza el boletin oficial ni certifica asistencia.
- Las filas pendientes se conservan para identificar sesiones incompletas.

## Fuera de alcance

- Reportes de calificaciones, matricula, adopcion, disponibilidad o incidentes.
- Programacion de reportes, jobs, correo o almacenamiento de archivos.
- PDF firmado, consecutivos o documentos oficiales.
- Integraciones oficiales con sistemas externos.

## Riesgos y siguientes pasos

- El reporte depende de que la institucion cierre y complete sus sesiones.
- Antes de datos reales se debe validar el resultado en staging con datos migrados y politica de retencion.
- Las siguientes slices deben priorizar reportes de matricula y calificaciones despues de definir sus filtros institucionales.
