# Estado actual de EduConnect

Fecha de corte: 2026-08-22.

Este documento describe el estado real observado en los dos repositorios de EduConnect y sirve como punto de partida para continuar el roadmap comercial. El backend y el portal son repositorios Git independientes; por tanto, sus cambios, validaciones y commits deben mantenerse separados.

## Resumen ejecutivo

EduConnect tiene una base funcional para autenticacion, usuarios, estructura academica, grupos, evaluaciones, actividades, analitica, notificaciones y calendario de clases. El primer corte de preparacion comercial implementa fundamentos P0 para sesiones revocables, instituciones, auditoria, aislamiento por tenant y operaciones de backup.

El producto aun no esta listo para datos reales de un colegio. El aislamiento por institucion esta implementado como una capacidad opt-in y el gate P0 sigue bloqueado hasta demostrarlo en un entorno de staging con migracion, backup restaurado y pruebas operativas. Tampoco estan completos el expediente de acudientes, matricula institucional completa, asistencia, boletines oficiales ni las comunicaciones comerciales.

## Repositorios y estado de trabajo

| Repositorio | Estado actual | Observacion |
| --- | --- | --- |
| `educonnect-backend` | Implementacion P0 en curso | Contiene los cambios de seguridad, tenant, auditoria, instituciones y operacion descritos abajo. |
| `educonnect-portal` | Calendario demo en desarrollo local | Tiene cambios locales de UI, navegacion, API demo y pruebas del calendario. Todavia no forman parte de un commit de este corte ni representan integracion productiva con el backend. |

La carpeta raiz `docs/task-to-make-educonnect-comercial` es un roadmap local ignorado por Git. La copia operativa de los PRDs comerciales se mantiene tambien en `educonnect-backend/prds/` cuando define contratos, datos o reglas de backend.

## Capacidades implementadas en el corte P0

### Sesiones y autenticacion

- Los tokens nuevos incluyen un identificador de sesion (`jti`) persistido en `Session`.
- Logout y cambio de password revocan sesiones.
- Un administrador puede consultar y revocar sesiones de otro usuario mediante los endpoints de usuarios.
- El middleware valida el estado de la sesion para tokens nuevos y conserva compatibilidad temporal con tokens legacy sin `jti` durante la migracion.
- La revocacion completa de sesiones antiguas y la rotacion avanzada de refresh tokens siguen siendo trabajo posterior del PRD 017.

### Institucion y tenant

- Existe el modelo `Institution` y un flujo administrativo para crear un sandbox y asignar usuarios.
- Los modelos escolares principales soportan `institution_id` y el contexto de tenant se propaga por request con `AsyncLocalStorage`.
- El plugin de tenant aplica asignacion automatica, filtros de lectura, actualizaciones y agregaciones cuando `TENANT_DATA_ISOLATION=true`.
- Las rutas de dominio pueden exigir contexto institucional con `REQUIRE_INSTITUTION_CONTEXT=true`.
- Hay indices compuestos e incluye un script de migracion para registros legacy.
- La capacidad esta preparada para staging, pero no se debe activar en produccion antes de ejecutar el runbook de migracion y comprobar aislamiento entre dos instituciones.

### Auditoria

- Existe `AuditLog`, servicio de escritura y endpoint administrativo paginado para consultar eventos.
- Se registran cambios sensibles de usuarios, sesiones, instituciones, grupos, matriculas, asignaciones y calificaciones.
- Los snapshots excluyen secretos como passwords, tokens y hashes.
- Sigue pendiente hacer atomica la mutacion de dominio y su evento de auditoria mediante transaccion o estrategia equivalente. Por eso la auditoria existe, pero no satisface por si sola el gate comercial.

### Operacion

- `GET /health/ready` comprueba la disponibilidad de MongoDB.
- Docker usa readiness como healthcheck.
- Existen scripts y runbooks para backup, restauracion y migracion de tenant.
- La restauracion aun requiere una ejecucion demostrable en staging y evidencia registrada antes de habilitar datos reales.

## Funcionalidad de producto

### Disponible o parcialmente disponible

- Autenticacion, ciclo de cuenta, usuarios y aprobaciones.
- Estructura academica base: anos, periodos, grados, areas y aulas.
- Grupos, enrolamientos y asignaciones docentes.
- Evaluaciones, resultados, actividades, entregas y analitica.
- Notificaciones in-app y anuncios dirigidos.
- Calendario visual en el portal conectado a API persistente, con catálogo real, consultas por rol, filtros administrativos, conflictos de horario y cancelación/reactivación; falta operar el módulo con datos institucionales en staging.

### Pendiente para el piloto comercial

- Configuracion institucional completa con sedes, jornadas y datos del colegio.
- Expediente de estudiantes, acudientes y relaciones autorizadas.
- Matricula por ano, sede, jornada, grado y grupo.
- Catalogo academico formal y carga docente.
- SIEE configurable, historial de notas, cierre y reapertura de periodos.
- Asistencia diaria, justificaciones e historial.
- Boletin oficial versionado y documentos verificables.
- Portal de acudientes restringido a estudiantes vinculados.
- Importacion controlada desde Excel/CSV, validacion por fila y trazabilidad del proceso.
- Reportes y comunicaciones institucionales listos para operacion repetible.

## Gate P0

| Control | Estado | Evidencia o bloqueo |
| --- | --- | --- |
| Aislamiento de tenant | Implementado, pendiente de evidencia | Flags opt-in, plugin, migracion y prueba automatizada; falta validacion en staging con datos migrados. |
| Revocacion de sesion | Implementada | Sesiones persistidas, logout, cambio de password y revocacion administrativa. |
| Auditoria | Parcial | Eventos y consulta disponibles; falta atomicidad con las mutaciones sensibles. |
| Backup y restauracion | Preparados | Scripts y runbooks disponibles; falta restauracion exitosa documentada. |
| Proteccion de datos de menores | Pendiente | Requiere completar permisos contextuales, acudientes, retencion y cumplimiento del PRD 018-019. |
| Permisos por actor | Parcial | Existen roles actuales; la separacion granular de secretaria y rector/coordinacion y el portal de acudientes son posteriores. |

El uso de datos reales debe permanecer bloqueado si cualquiera de estos controles no tiene evidencia verificable.

## Validaciones ejecutadas

En `educonnect-backend` se validaron los siguientes comandos:

- `yarn test`: 7 suites y 45 pruebas aprobadas.
- `yarn typecheck`: aprobado.
- `yarn build`: aprobado.
- `git diff --check`: aprobado.
- `bash -n scripts/backup-mongodb.sh scripts/restore-mongodb.sh`: aprobado.
- Ayuda de `yarn backup:mongodb`, `yarn restore:mongodb` y `yarn migrate:tenant`: disponible.

Estas validaciones comprueban el corte de codigo, pero no sustituyen la prueba de restauracion ni la validacion de despliegue en staging.

## Siguiente secuencia recomendada

1. Preparar un entorno de staging con MongoDB y secretos separados.
2. Crear una institucion sandbox, asignar usuarios sinteticos y ejecutar la migracion tenant.
3. Ejecutar backup, restaurarlo en una base aislada y registrar evidencia de integridad.
4. Activar los flags tenant en staging y ejecutar pruebas de aislamiento, permisos y revocacion.
5. Completar los PRDs 017 y 018 para permisos contextuales, auditoria atomica, consentimiento y proteccion de menores.
6. Implementar los PRDs 019-023 y validar el PRD 013 con datos institucionales en staging.
7. Implementar los PRDs 024-029 para migracion, boletines, documentos, portal de acudientes, reportes y comunicaciones.
8. Ejecutar el flujo completo del piloto con datos sinteticos y aprobar el gate P0.
9. Habilitar datos reales solo despues de la aprobacion formal del gate.

El alcance comercial, los criterios de salida y las dependencias se encuentran en [`prds/014-commercial-scope-and-pilot.md`](../prds/014-commercial-scope-and-pilot.md). El orden completo del roadmap se conserva, cuando esta disponible, en la carpeta local ignorada `docs/task-to-make-educonnect-comercial` del workspace compartido; este repositorio no depende de ella para ejecutar el backend.

## Runbooks relacionados

- [Backup y restauracion](./backup-restore.md)
- [Migracion de tenant](./tenant-migration.md)
- [Flujo de autenticacion](./authentication_flow.md)
- [Documentacion de API](./api_docs.md)
