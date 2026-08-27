# Estado actual de EduConnect

Fecha de corte: 2026-08-22.

Este documento describe el estado real observado en los dos repositorios de EduConnect y sirve como punto de partida para continuar el roadmap comercial. El backend y el portal son repositorios Git independientes; por tanto, sus cambios, validaciones y commits deben mantenerse separados.

## Resumen ejecutivo

EduConnect tiene una base funcional para autenticacion, usuarios, estructura academica, grupos, evaluaciones, actividades, analitica, notificaciones, asistencia y calendario de clases. Los cortes de preparacion comercial tambien incluyen portal familiar, importacion CSV y politica SIEE inicial.

El producto aun no esta listo para datos reales de un colegio. El aislamiento por institucion esta implementado como una capacidad opt-in y el gate P0 sigue bloqueado hasta demostrarlo en un entorno de staging con migracion, backup restaurado y pruebas operativas. La interfaz y API de sedes/jornadas ya estan implementadas, pero falta configurarlas con los datos reales y validar sus reglas operativas. Tampoco estan completos el expediente legal de acudientes, boletines oficiales ni los reportes y documentos institucionales.

## Repositorios y estado de trabajo

| Repositorio | Estado actual | Observacion |
| --- | --- | --- |
| `educonnect-backend` | Implementacion P0 en curso | Contiene los cambios de seguridad, tenant, auditoria, instituciones y operacion descritos abajo. |
| `educonnect-portal` | Portal conectado en desarrollo local | Tiene cambios locales de UI, navegacion, APIs de asistencia, familia, importaciones y calendario. Todavia no forman parte de un commit de este corte ni representan integracion productiva con el backend. |

La carpeta raiz `docs/task-to-make-educonnect-comercial` es un roadmap local ignorado por Git y queda solo como referencia de priorizacion. La fuente versionada y canonica de los PRDs es [`prds/README.md`](../prds/README.md); alli se distingue el trabajo parcial del trabajo planificado.

## Estado documental del roadmap

Los huecos numericos entre los PRDs no representan documentos ocultos. Todos los PRDs comerciales `015-034` tienen ahora un archivo en `prds/` con alcance, dependencias, estado real y criterios de aceptacion.

- `015` y `017-024`: ejecucion parcial o slices implementadas, con pendientes operativos o de dominio explicitos.
- `025-026` y `030-034`: planificados; documentan el trabajo futuro sin presentarlo como funcionalidad disponible.
- `027-029`: slices comerciales parcialmente implementadas y enlazadas con sus dependencias.

La copia local del roadmap no debe editarse como fuente de estado. Cuando exista una diferencia, prevalecen `prds/README.md`, el PRD correspondiente y este documento.

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
- Corte inicial del portal de acudiente: relaciones autorizadas y dashboard con datos de varios estudiantes.
- Primera slice de asistencia: sesiones por grupo, estados, justificaciones, cierre y resumen para acudientes.
- Reporte institucional de asistencia en JSON y CSV, filtrable por año, grupo y rango de fechas desde el portal administrativo.
- Exportación CSV del padrón de matrículas con grupo, grado, sede y jornada desde la administración.
- Boletin basico para acudientes: consulta autorizada por estudiante, ano y periodo; el documento oficial firmado sigue pendiente.
- Calendario visual en el portal conectado a API persistente, con disponibilidad semanal publicada por grupo, sesiones concretas, alcance por rol, conflictos de horario, excepciones administrativas y cancelación/reactivación; falta operar el módulo con datos institucionales en staging.

### Pendiente para el piloto comercial

- Configuracion institucional completa con datos reales de colegio y reglas de compatibilidad entre sede, jornada, grupo, aula y docente; el CRUD base de sedes y jornadas ya esta disponible en /institution/structure.
- Expediente completo de estudiantes y acudientes, custodia, consentimientos y documentos base.
- Matricula por ano, sede, jornada, grado y grupo; sede y jornada ya son referencias opcionales en el flujo administrativo y en la importacion CSV.
- Catalogo academico formal y carga docente.
- SIEE inicial configurable por año lectivo con escala, umbral y niveles base; quedan pendientes recuperación, versionado y edición posterior de la política. El cierre y reapertura controlada de periodos ya tiene una slice auditada.
- Asistencia diaria, justificaciones e historial; la primera slice operativa y el reporte CSV ya están disponibles para grupos, acudientes y administración. Siguen pendientes notificaciones automáticas y reportes adicionales.
- Boletin oficial versionado y documentos verificables; el boletin basico HTML ya esta disponible para estudiantes y acudientes.
- Portal de acudientes ampliado con asistencia, boletines, calendario y comunicaciones; documentos y solicitudes siguen pendientes.
- Importacion CSV controlada para estudiantes, acudientes, docentes, grados, areas, grupos y matriculas; XLSX, jobs y exportaciones siguen pendientes.
- Reportes institucionales adicionales y comunicaciones con operación repetible completa.

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

- `yarn test`: 14 suites y 65 pruebas aprobadas, incluyendo asistencia, reporte CSV, boletin, portal de acudiente, calendario familiar, importacion controlada, SIEE, comunicaciones, estructura institucional y cierre de periodos.
- `yarn typecheck`: aprobado.
- `yarn build`: aprobado.
- `git diff --check`: aprobado.
- `educonnect-portal`: `yarn test` con 10 archivos y 23 pruebas aprobadas; `yarn typecheck` y `yarn build:ci` aprobados. La validación visual local requiere una sesión autenticada o `VITE_CALENDAR_DATA_SOURCE=demo`.
- `bash -n scripts/backup-mongodb.sh scripts/restore-mongodb.sh`: aprobado.
- Ayuda de `yarn backup:mongodb`, `yarn restore:mongodb` y `yarn migrate:tenant`: disponible.

Estas validaciones comprueban el corte de codigo, pero no sustituyen la prueba de restauracion ni la validacion de despliegue en staging.

## Siguiente secuencia recomendada

1. Preparar un entorno de staging con MongoDB y secretos separados.
2. Crear una institucion sandbox, asignar usuarios sinteticos y ejecutar la migracion tenant.
3. Ejecutar backup, restaurarlo en una base aislada y registrar evidencia de integridad.
4. Activar los flags tenant en staging y ejecutar pruebas de aislamiento, permisos y revocacion.
5. Completar los PRDs 017 y 018 para permisos contextuales, auditoria atomica, consentimiento y proteccion de menores.
6. Levantar datos reales y reglas operativas de sedes/jornadas, y definir expediente/documentos, recuperaciones SIEE, boletin oficial y reportes institucionales.
7. Extender importaciones a XLSX, jobs, reintentos y exportaciones; validar el flujo con datos institucionales en staging.
8. Ejecutar el flujo completo del piloto con datos sinteticos y aprobar el gate P0.
9. Habilitar datos reales solo despues de la aprobacion formal del gate.

El alcance comercial, los criterios de salida y las dependencias se encuentran en [`prds/014-commercial-scope-and-pilot.md`](../prds/014-commercial-scope-and-pilot.md). El inventario y estado de todos los PRDs están en [`prds/README.md`](../prds/README.md). El roadmap local ignorado puede consultarse como contexto, pero este repositorio no depende de él para ejecutar el backend.

## Runbooks relacionados

- [Backup y restauracion](./backup-restore.md)
- [Migracion de tenant](./tenant-migration.md)
- [Flujo de autenticacion](./authentication_flow.md)
- [Documentacion de API](./api_docs.md)
