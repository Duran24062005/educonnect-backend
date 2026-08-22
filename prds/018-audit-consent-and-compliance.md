# PRD 018 - Auditoria, consentimiento y cumplimiento

## Estado

- Estado: auditoria base implementada; atomicidad, consentimiento y retencion pendientes.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 015, PRD 016 y PRD 017.

## Problema y objetivo

EduConnect trata datos academicos y datos de menores. Registrar un evento de auditoria no basta si la mutacion puede quedar guardada sin su evento, si no existe consentimiento versionado o si no hay reglas de retencion. El objetivo es demostrar quien hizo cada cambio, bajo que autorizacion y durante cuanto tiempo debe conservarse.

## Resultado de la planeacion

- Mantener `AuditLog` append-only para consulta administrativa.
- Asociar eventos a actor, tenant, entidad, accion, fecha y contexto de request.
- Diseñar consentimiento y solicitudes de titulares antes de habilitar datos reales.
- Usar transacciones MongoDB o una estrategia equivalente para mutacion y auditoria.

## Alcance

- Auditoria de usuarios, sesiones, instituciones, matriculas, notas, documentos y permisos.
- Snapshots seguros de valores anterior y nuevo.
- Consentimientos versionados con responsable, alcance, fecha y revocacion.
- Retencion, exportacion y eliminacion conforme a la politica aprobada.
- Solicitudes de consulta, correccion, revocacion y supresion cuando apliquen.
- Acceso restringido y no modificable desde los flujos normales.

## Estado actual

### Implementado

- Existe `AuditLog` con actor, rol, accion, entidad, snapshots, tenant y metadata.
- Se excluyen passwords, tokens y secretos de los snapshots.
- Se auditan mutaciones sensibles de calificaciones, matriculas, asignaciones, sesiones e instituciones.
- Existe consulta administrativa paginada.

### Pendiente

- Hacer atomicas las mutaciones sensibles y su evento de auditoria.
- Modelo de consentimiento y versiones de politica.
- Retencion, exportacion y eliminacion controlada.
- Flujo de solicitudes de titulares y responsables de respuesta.
- Expediente de evidencia legal del piloto.

## Actores

- Titular o representante legal.
- Acudiente autorizado.
- Usuario administrativo.
- Auditor o responsable de cumplimiento.
- Soporte, con acceso temporal y auditado.

## Contrato funcional esperado

### Acciones

- Mantener la consulta administrativa de `AuditLog`.
- Incorporar acciones de consentimiento, revocacion y solicitudes de titulares.
- Asociar cada cambio sensible a un `correlation_id` de request o transaccion.

### Reglas

- Los usuarios finales no pueden editar ni borrar auditoria.
- No se almacenan secretos en snapshots ni mensajes de error.
- La revocacion de consentimiento no debe borrar historicos que la ley o la operacion obliguen a conservar.
- Un acceso a datos de un menor debe poder explicarse por actor y vinculo.

## Impacto tecnico

- Ampliar modelos, servicios y permisos de auditoria sin romper los eventos existentes.
- Evaluar `withTransaction()` de MongoDB y comportamiento cuando el despliegue no soporte transacciones.
- Documentar politica de retencion y almacenamiento de documentos en `docs/`.

## Criterios de aceptacion

- Una prueba provoca rollback de mutacion y auditoria cuando falla una de las dos.
- Se puede consultar el historial de una nota, matricula, sesion y documento.
- El consentimiento muestra version, responsable, alcance, fecha y estado.
- Existe procedimiento de acceso restringido, exportacion y retencion.
- La institucion puede entregar evidencia de cumplimiento durante el piloto.

## Riesgos y preguntas abiertas

- La politica legal colombiana debe ser validada por asesor competente.
- Retener snapshots completos puede aumentar la exposicion de datos sensibles.
- Debe definirse el responsable institucional de atender solicitudes de titulares.
