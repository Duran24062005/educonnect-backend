# 001 - Platform Specification (General PRD)

Este archivo centraliza la documentación funcional y técnica de la plataforma EduConnect. Se irá actualizando y extendiendo con cada PRD numerado adicional (ej. 002-..., 003-...).

## Visión general

EduConnect es una plataforma educativa para gestión académica, comunicación y evaluación. Contendrá módulos de usuarios, aulas, contenidos, actividades, evaluaciones, reportes y administración.

## Ámbito del documento

Este archivo sirve como referencia central. Cada funcionalidad tendrá su propio PRD numerado en la carpeta `prds/`, y se resumirá o enlazará aquí.

## Estructura del repositorio de PRDs

- `prds/001-platform-spec.md` — Documento general (este archivo)
- `prds/002-user-registration-roles.md` — PRD de registro y roles (detallado)
- `prds/003-authentication-account-lifecycle.md` — Autenticación, login, perfil y contraseña
- `prds/004-user-administration-approvals.md` — Administración, aprobación y estados de usuario
- `prds/005-academic-structure-lifecycle.md` — Años escolares, periodos, grados, áreas, aulas y promoción
- `prds/006-groups-enrollments-assignments.md` — Grupos, matrículas, traslados, docentes y aulas
- `prds/007-evaluations-results-calculation.md` — Evaluaciones, notas y resultados académicos
- `prds/008-analytics-role-based-dashboards.md` — Dashboards analíticos por rol
- `prds/013-calendar-class-schedule.md` — Calendario de clases y sesiones académicas
- `prds/014-commercial-scope-and-pilot.md` — Alcance comercial y piloto institucional de 90 días

## Convenciones

- Nomenclatura: `NNN-short-description.md` (p. ej. `002-user-registration-roles.md`)
- Cada PRD debe incluir: objetivo, alcance, endpoints, esquemas de request/response, flujo, dependencias, y notas de despliegue.

## Registro de cambios

- 2026-02-03: Creado documento y añadido PRD de registro (002)
- 2026-03-10: Añadidos PRDs 003-008 para documentar autenticación, usuarios, estructura académica, grupos, evaluaciones y analítica
- 2026-08-22: Añadido PRD 014 para definir el alcance comercial y las condiciones del piloto institucional

## Enlaces rápidos

- PRDs: `prds/`
- Documentación técnica: `docs/`
- Cambios del sistema: `docs/SystemArtifacts.md`
