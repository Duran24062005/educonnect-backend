# Resumen de Capas y Módulos - EduConnect

## Resultado

El backend usa un monolito modular: los módulos organizan el código por dominio y las capas se mantienen dentro de cada módulo. La aplicación continúa siendo un único deploy.

## Flujo

`app -> modules/<domain> -> controller -> service -> repositories/models`

## Capas

1. `modules/<domain>`: unidad de negocio con endpoint y reglas relacionadas.
2. `controllers`: request/response, sin lógica de negocio pesada.
3. `services`: reglas de negocio y coordinación.
4. `repositories`: consultas y persistencia MongoDB compartida.
5. `models`: esquemas, índices y restricciones.

## Componentes transversales

- `modules/<domain>/*.validators.ts`: contratos de entrada con Zod junto a su dominio.
- `shared/`: validación común, scope y servicios técnicos transversales.
- `middlewares/errorHandler.js`: manejo global de errores.
- `middlewares/authorizeRoles.js`: RBAC reutilizable.
- `docs/swagger.js`: especificación OpenAPI.

## Beneficios prácticos

- Menor acoplamiento entre capas.
- Mayor facilidad para testing.
- Errores uniformes y trazables.
- API más segura por validación temprana.
- Base preparada para crecimiento por módulos y futura extracción selectiva si el producto lo requiere.
