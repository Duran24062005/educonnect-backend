# Resumen de Capas - Refactor 2026

## Resultado

Se consolidó una arquitectura backend limpia, con separación real de responsabilidades y componentes transversales para producción.

## Capas

1. `routes`: endpoints y middlewares por ruta.
2. `controllers`: request/response, sin lógica de negocio pesada.
3. `services`: reglas de negocio y coordinación.
4. `repositories`: consultas y persistencia MongoDB.
5. `models`: esquemas, índices y restricciones.

## Componentes transversales

- `validators/`: contratos de entrada con Zod.
- `middlewares/errorHandler.js`: manejo global de errores.
- `middlewares/authorizeRoles.js`: RBAC reutilizable.
- `docs/swagger.js`: especificación OpenAPI.

## Beneficios prácticos

- Menor acoplamiento entre capas.
- Mayor facilidad para testing.
- Errores uniformes y trazables.
- API más segura por validación temprana.
- Base preparada para crecimiento por módulos.

