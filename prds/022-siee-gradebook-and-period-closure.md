# PRD 022 - SIEE, gradebook y cierre de periodos

## Estado

- Estado: primera slice implementada; política SIEE configurable inicial implementada.
- Alcance actual: escala por año lectivo, validación de notas, niveles base, cierre y reapertura auditada.
- Repositorio: `educonnect-backend` y `educonnect-portal`.

## Problema y objetivo

Las notas no deben poder modificarse indefinidamente después del cierre académico. El objetivo de esta primera slice es ofrecer un cierre administrativo auditable que bloquee altas, cambios y eliminaciones de ítems y calificaciones, con reapertura explícita por administración.

## Implementación realizada

- `Period` tiene estado `open|closed`, fecha de cierre y usuario que ejecutó el cambio.
- Administración usa `PATCH /api/academic/periods/:id/status` para cerrar o reabrir un periodo.
- El cierre registra eventos `period.closed` y `period.opened` en `AuditLog`.
- La creación, edición y eliminación de ítems de evaluación y el registro de notas rechazan cambios cuando el periodo está cerrado.
- La pantalla administrativa de periodos muestra el estado y permite cerrar o reabrir.
- La prueba de API verifica el bloqueo para docentes y la reapertura controlada.

## Pendiente de este PRD

- Edición posterior de la política y versionado de cambios.
- Recuperaciones, nivelaciones y versionado de la política SIEE.

## Reglas y permisos

- Solo `admin` puede cambiar el estado de un periodo.
- Un periodo cerrado conserva sus datos para consulta y cálculo, pero no acepta mutaciones de calificaciones.
- Reabrir un periodo genera un evento de auditoría y vuelve a habilitar las mutaciones permitidas por el rol.

## Riesgos y casos límite

- El cierre no sustituye todavía una transacción atómica entre mutación y auditoría.
- Los años existentes sin política explícita usan compatibilidad 0-10 con aprobación en 6.
- La reapertura debe reservarse para correcciones autorizadas y quedar incluida en la revisión operativa del piloto.
