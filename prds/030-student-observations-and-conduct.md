# PRD 030 - Observador, convivencia y conducta

## Estado

- Estado: planificado; no hay modulo de observaciones implementado.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 018, PRD 019, PRD 027 y PRD 029.

## Problema y objetivo

Los colegios necesitan registrar observaciones y compromisos sin convertir una nota disciplinaria en un dato visible para cualquier usuario. El objetivo es ofrecer un expediente restringido de convivencia con trazabilidad, evidencias y seguimiento.

## Alcance

- Observacion, categoria, fecha, actor y contexto.
- Compromisos, responsables, fechas de seguimiento y estado.
- Evidencias privadas y remisiones.
- Visibilidad diferenciada para coordinacion, docentes, acudientes y estudiante.
- Historial inmutable de cambios sensibles.

## No implementado en el corte actual

- No existen modelos, rutas, permisos ni pantallas de observador.
- Las notas libres actuales no deben reutilizarse como expediente disciplinario.

## Actores

- Coordinacion o convivencia.
- Docente con permiso sobre su grupo.
- Estudiante y acudiente, segun visibilidad aprobada.
- Rector y responsable de cumplimiento.

## Contrato funcional esperado

- Recurso futuro: `StudentObservation`, `ConductCommitment` y `ConductEvidence`.
- Las consultas deben filtrar por tenant, estudiante y permiso contextual.
- Una observacion cerrada no se elimina; se corrige mediante evento o version.
- El acudiente no debe ver investigaciones o evidencias restringidas por defecto.

## Impacto tecnico

- Modelos tenant-owned, storage privado y auditoria.
- Matriz de permisos especifica, dependiente del PRD 017.
- Retencion y tratamiento de datos sensibles, dependiente del PRD 018.

## Criterios de aceptacion

- Un docente no puede consultar observaciones fuera de su alcance.
- Coordinacion puede abrir, hacer seguimiento y cerrar un caso.
- Cada cambio conserva actor, fecha y motivo.
- Evidencias requieren permisos y enlaces temporales.
- El estudiante/acudiente recibe solo la vista institucional aprobada.

## Riesgos y preguntas abiertas

- La institucion debe definir categorias, procedimiento y derecho de respuesta.
- Puede aplicar una politica de datos distinta a la del expediente academico.
- No implementar notificaciones automaticas hasta definir confidencialidad.
