# Registro de PRDs

Este archivo es el indice canonico de los PRDs de `educonnect-backend`. La carpeta local `docs/task-to-make-educonnect-comercial` es un roadmap de trabajo ignorado por Git y no debe usarse como fuente de estado.

Los estados describen la realidad del repositorio, no solo la existencia del archivo:

- **Base existente**: documenta funcionalidad anterior al roadmap comercial.
- **En ejecucion**: tiene implementacion parcial o una slice operativa, pero conserva pendientes.
- **Planificado**: el alcance esta documentado, pero la funcionalidad no esta implementada.

## Inventario

| ID | Documento | Estado | Nota de trazabilidad |
| --- | --- | --- | --- |
| 000 | [Plantilla](./000-prd-template.md) | Referencia | Estructura minima para nuevos PRDs. |
| 001 | [Especificacion de plataforma](./001-platform-spec.md) | Base existente | Indice historico y referencia general. |
| 002 | [Registro y roles](./002-user-registration-roles.md) | Base existente | Flujo inicial de usuarios. |
| 003 | [Autenticacion y ciclo de cuenta](./003-authentication-account-lifecycle.md) | Base existente | Login, perfil y password. |
| 004 | [Administracion y aprobaciones](./004-user-administration-approvals.md) | Base existente | Estados y administracion de usuarios. |
| 005 | [Estructura academica](./005-academic-structure-lifecycle.md) | Base existente | Años, periodos, grados, areas y aulas. |
| 006 | [Grupos, matriculas y asignaciones](./006-groups-enrollments-assignments.md) | Base existente | Operacion academica previa al roadmap. |
| 007 | [Evaluaciones y resultados](./007-evaluations-results-calculation.md) | Base existente | Notas y calculos iniciales. |
| 008 | [Dashboards y analitica](./008-analytics-role-based-dashboards.md) | Base existente | Consultas agregadas por rol. |
| 009 | [Rendimiento](./009-performance-loading-optimization.md) | Base existente | Carga y endpoints agregados. |
| 010 | [Notificaciones](./010-notifications-announcements.md) | Base existente | Notificaciones y anuncios iniciales. |
| 011 | [Storage privado](./011-private-file-storage-s3.md) | Base existente | Archivos privados y URLs firmadas. |
| 012 | [Boletin con datos reales](./012-student-bulletin-real-data.md) | Base existente | Antecedente del boletin basico. |
| 013 | [Calendario](./013-calendar-class-schedule.md) | En ejecucion | Persistencia y permisos implementados; operacion en staging pendiente. |
| 014 | [Alcance comercial y piloto](./014-commercial-scope-and-pilot.md) | En ejecucion | Define el piloto y el gate P0. |
| 015 | [Fundacion de produccion](./015-production-foundation.md) | En ejecucion | Readiness, backups y runbooks existen; staging y observabilidad pendientes. |
| 016 | [Multi-tenancy y estructura institucional](./016-multi-tenancy-institutional-structure.md) | En ejecucion | Tenant, sedes y jornadas implementados; activacion en staging pendiente. |
| 017 | [Seguridad, sesiones y permisos](./017-security-sessions-and-permissions.md) | En ejecucion | Sesiones y scope base existen; MFA y permisos granulares pendientes. |
| 018 | [Auditoria, consentimiento y cumplimiento](./018-audit-consent-and-compliance.md) | En ejecucion | Auditoria base existe; atomicidad y consentimiento pendientes. |
| 019 | [Estudiantes, acudientes y expediente](./019-student-guardian-record.md) | En ejecucion | Vinculo familiar existe; expediente legal pendiente. |
| 020 | [Ciclo de vida de matricula](./020-enrollment-lifecycle.md) | En ejecucion | Estados, traslados y referencias estructurales existen; ciclo completo pendiente. |
| 021 | [Catalogo academico y asignaciones](./021-academic-catalog-and-teaching-assignments.md) | En ejecucion | Catalogo legado y asignaciones existen; asignatura y plan formal pendientes. |
| 022 | [SIEE, gradebook y cierre](./022-siee-gradebook-and-period-closure.md) | En ejecucion | Politica inicial y cierre implementados; recuperaciones/versionado pendientes. |
| 023 | [Asistencia](./023-attendance.md) | En ejecucion | Operacion y reportes iniciales implementados. |
| 024 | [Importacion, exportacion y migracion](./024-import-export-and-migration.md) | En ejecucion | CSV controlado implementado; XLSX y jobs pendientes. |
| 025 | [Boletines oficiales](./025-official-bulletins.md) | Planificado | El boletin basico no es emision oficial. |
| 026 | [Certificados y documentos](./026-academic-certificates-and-documents.md) | Planificado | Storage privado disponible; emision y verificacion pendientes. |
| 027 | [Portal de acudiente](./027-guardian-portal.md) | En ejecucion | Dashboard multiestudiante, asistencia, boletin basico y comunicaciones. |
| 028 | [Reportes institucionales](./028-institutional-reports.md) | En ejecucion | Reportes CSV iniciales; cobertura adicional pendiente. |
| 029 | [Comunicaciones escolares](./029-school-communications.md) | En ejecucion | Comunicaciones in-app y dirigidas; canales y reintentos pendientes. |
| 030 | [Observador y convivencia](./030-student-observations-and-conduct.md) | Planificado | No hay modulo implementado. |
| 031 | [Jobs asincronos y escala](./031-async-jobs-and-commercial-scale.md) | Planificado | Importaciones y reportes actuales no son workers durables. |
| 032 | [Integraciones colombianas](./032-colombian-reporting-integrations.md) | Planificado | No hay integraciones oficiales activas. |
| 033 | [Onboarding y soporte](./033-commercial-onboarding-and-support.md) | Planificado | Hay runbooks tecnicos parciales, no proceso comercial completo. |
| 034 | [Analitica de diferenciacion](./034-differentiation-analytics.md) | Planificado | Dashboards base existentes; riesgo y benchmarking pendientes. |
| 035 | [Monolito modular del backend](./035-modular-monolith-backend.md) | Base existente | Módulos de dominio y composición HTTP modular implementados sin cambiar contratos. |
| 037 | [Disponibilidad semanal por grupo](./037-weekly-group-availability.md) | En ejecucion | Ventanas publicadas por grupo, sesiones validadas y excepciones administrativas. |
| 038 | [Materiales educativos por sesión](./038-session-materials.md) | En ejecución | CRUD de recursos por sesión, storage privado, permisos por docente/matrícula y acceso contextual desde calendario. |

## Regla de mantenimiento

Cuando una funcionalidad cambie contratos, permisos, datos o criterios de operacion, se actualiza primero el PRD correspondiente y despues `docs/project-status.md`. Un PRD en estado planificado no autoriza implementar ni vender la capacidad descrita.

Los contratos visuales y decisiones de UX se documentan adicionalmente en `educonnect-portal/docs/`, porque el portal es un repositorio Git independiente.
