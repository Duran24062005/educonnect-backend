# 001 - Platform Specification (General PRD)

Este archivo centraliza la documentación funcional y técnica de la plataforma EduConnect. Se irá actualizando y extendiendo con cada PRD numerado adicional (ej. 002-..., 003-...).

## Visión general

EduConnect es una plataforma educativa para gestión académica, comunicación y evaluación. Contendrá módulos de usuarios, aulas, contenidos, actividades, evaluaciones, reportes y administración.

## Ámbito del documento

Este archivo sirve como referencia central. Cada funcionalidad tendrá su propio PRD numerado en la carpeta `prds/`, y se resumirá o enlazará aquí.

## Estructura del repositorio de PRDs

El inventario completo, con estado real y dependencias, está en [`prds/README.md`](./README.md). Los documentos principales se mantienen separados por dominio y no se deben inferir por continuidad numérica.

Los PRDs comerciales son:

- `014-commercial-scope-and-pilot.md` — Alcance comercial y piloto institucional de 90 días
- `015-production-foundation.md` a `018-audit-consent-and-compliance.md` — Fundación operativa, tenant, seguridad y cumplimiento
- `019-student-guardian-record.md` a `024-import-export-and-migration.md` — Núcleo escolar e importación
- `025-official-bulletins.md` y `026-academic-certificates-and-documents.md` — Documentos académicos verificables
- `027-guardian-portal.md` a `029-school-communications.md` — MVP comercial
- `030-student-observations-and-conduct.md` a `034-differentiation-analytics.md` — Operación y diferenciación posteriores

## Convenciones

- Nomenclatura: `NNN-short-description.md` (p. ej. `002-user-registration-roles.md`)
- Cada PRD debe incluir: objetivo, alcance, endpoints, esquemas de request/response, flujo, dependencias, y notas de despliegue.

## Registro de cambios

- 2026-02-03: Creado documento y añadido PRD de registro (002)
- 2026-03-10: Añadidos PRDs 003-008 para documentar autenticación, usuarios, estructura académica, grupos, evaluaciones y analítica
- 2026-08-22: Añadido PRD 014 para definir el alcance comercial y las condiciones del piloto institucional
- 2026-08-22: Creado el registro canónico y documentados los PRDs comerciales 015-034 con estado explícito

## Enlaces rápidos

- PRDs: [`prds/README.md`](./README.md)
- Documentación técnica: `docs/`
- Cambios del sistema: `docs/SystemArtifacts.md`
