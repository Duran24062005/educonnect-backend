# Backend Documentation Map

Esta carpeta documenta el repositorio `educonnect-backend` como sistema independiente.

Importante:

- Este directorio no documenta decisiones de UI del portal.
- Si una iniciativa impacta frontend y backend, aqui debe quedar explicito el contrato del backend.
- El consumo del contrato debe documentarse en `educonnect-portal`.

## Lectura recomendada

1. [repository-context.md](./repository-context.md)
2. [Architecture.md](./Architecture.md)
3. [api_docs.md](./api_docs.md)
4. [authentication_flow.md](./authentication_flow.md)
5. [database_docs.md](./database_docs.md)
6. [documentation_guide.md](./documentation_guide.md)
7. [000-doc-template.md](./000-doc-template.md)
8. [commit-conventions.md](./commit-conventions.md)
9. [ci-quality-gates.md](./ci-quality-gates.md)

## Documentos utiles por tema

- Arquitectura: [Architecture.md](./Architecture.md), [layers_summary.md](./layers_summary.md)
- API y autenticacion: [api_docs.md](./api_docs.md), [auth_guide.md](./auth_guide.md), [authentication_flow.md](./authentication_flow.md)
- Base de datos: [database_docs.md](./database_docs.md)
- Resumenes historicos: [implmentation_summary.md](./implmentation_summary.md), [before_after_comparison.md](./before_after_comparison.md), [SystemArtifacts.md](./SystemArtifacts.md)
- Calidad y CI: [ci-quality-gates.md](./ci-quality-gates.md)

## Fuente de verdad sugerida

- `README.md`: onboarding rapido del repo
- `docs/repository-context.md`: alcance, ownership y criterios de documentacion
- `src/`: implementacion real
- `src/docs/swagger.ts`: referencia viva de endpoints documentados
- `api/index.ts`: entrada real usada por Vercel en despliegue serverless
- `prds/`: contexto funcional relacionado con trabajo de este repositorio
- `prds/000-prd-template.md`: plantilla base para nuevos PRDs

## Regla de mantenimiento

Cuando cambie alguno de estos elementos, esta carpeta debe revisarse:

- rutas o payloads HTTP
- variables de entorno
- estrategia de uploads
- estrategia de despliegue y entrypoints serverless
- seeds o flujos operativos de desarrollo
- contratos usados por dashboards agregados
- contratos de notificaciones, anuncios y estrategia de entrega in-app
