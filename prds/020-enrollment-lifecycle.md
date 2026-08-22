# PRD 020 - Ciclo de vida de matricula

## Estado

- Estado: parcialmente implementado; falta formalizar eventos, documentos y aprobaciones.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 016 y PRD 019.

## Problema y objetivo

Una matricula no es solo una fila activa: cambia de grupo, sede, jornada, estado y año. El objetivo es conservar un historial coherente y auditable de admision, continuidad, traslado, retiro, reingreso, repitencia y promocion.

## Resultado de la planeacion

- Mantener una matricula por estudiante y año con una sola activa.
- Conservar filas historicas y enlazar traslados mediante `previous_enrollment_id`.
- No eliminar matriculas con historia; usar estados y eventos.
- Separar la promocion academica del acto administrativo de matricular en el siguiente año.

## Alcance

- Matricula por año, sede, jornada, grado y grupo.
- Estados active, transferred y retired como base compatible.
- Admision, aprobacion, traslado, retiro, reingreso y continuidad.
- Documentos y requisitos asociados.
- Capacidad de grupo y validacion de referencias activas.
- Historial, reportes y auditoria.

## Estado actual

### Implementado

- `Enrollment` soporta estados activos, transferidos y retirados.
- Se valida una matricula activa por estudiante y año.
- El traslado crea una nueva matricula enlazada con la anterior.
- Sede y jornada pueden referenciarse y se incluyen en el reporte CSV.
- Existe cambio administrativo de estado y auditoria basica.
- La promocion masiva existe en el modulo academico.

### Pendiente

- Estados y eventos de admision, aprobacion, reingreso y repitencia.
- Requisitos documentales y checklist de matricula.
- Integrar promocion con una nueva matricula y aprobacion institucional.
- Validar compatibilidad entre sede, jornada, grupo, aula y docente.
- Evitar mutaciones parciales mediante transaccion o estrategia equivalente.

## Actores

- Secretaria/coordinacion.
- Rector.
- Acudiente.
- Estudiante.
- Docente, solo como consumidor de la matricula autorizada.

## Contrato funcional esperado

### Acciones existentes

- `POST /api/groups/enrollments`.
- `POST /api/groups/enrollments/transfer`.
- `PATCH /api/groups/enrollments/:id/status`.
- `GET /api/groups/enrollments/student/:student_id`.

### Reglas futuras

- Toda transicion valida el estado actual y registra motivo, actor y fecha.
- Un retiro impide operaciones academicas activas posteriores al corte definido.
- Un reingreso crea una nueva situacion administrativa sin borrar el historial.
- Un documento faltante bloquea solo la transicion que la politica institucional defina.

## Impacto tecnico

- Ampliar el modelo con eventos o historial de transiciones.
- Mantener compatibilidad con importacion CSV y reportes.
- Auditar cambios y protegerlos con contexto tenant.

## Criterios de aceptacion

- Un estudiante puede recorrer un ciclo completo sin perder su historial.
- No existen dos matriculas activas del mismo estudiante en el mismo año.
- Un traslado conserva origen, destino, motivo y actor.
- Las referencias de sede y jornada se validan dentro de la institucion.
- El reporte permite reconstruir la matricula vigente y sus antecedentes.

## Riesgos y preguntas abiertas

- La politica de admision y documentos varia entre colegios.
- Promocion y matricula requieren una decision institucional sobre aprobacion manual.
- Debe definirse si retiro y traslado tienen fechas efectivas independientes de la fecha de registro.
