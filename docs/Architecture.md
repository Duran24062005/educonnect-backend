# Arquitectura Backend - EduConnect (Actualizado)

## Visión general

El backend sigue una arquitectura por capas orientada a mantenibilidad y escalabilidad:

`routes -> controllers -> services -> repositories -> models`

Además, se incorporan capas transversales:

- `middlewares`: auth, autorización por roles, validación y manejo global de errores.
- `validators`: esquemas Zod para `body`, `params` y `query`.
- `config`: configuración centralizada de entorno y conexión a MongoDB.
- `docs`: OpenAPI/Swagger y documentación funcional.
- `tests`: pruebas de integración con Jest + Supertest.
- `types`: tipos compartidos y extensiones de Express/Mongoose.
- `api`: entrada serverless para Vercel, separada del bootstrap Node tradicional.

## Estructura actual de `src/`

```text
src/
  app.ts
  index.ts
  config/
  constants/
  controllers/
  docs/
  middlewares/
  models/
  repositories/
  routes/
  services/
  types/
  utils/
  validators/
api/
database/
tests/
```

## Responsabilidades por capa

- `routes`: define endpoints y encadena middlewares.
- `controllers`: capa HTTP (request/response). Sin lógica de negocio compleja.
- `services`: reglas de negocio, validaciones de dominio y orquestación.
- `repositories`: acceso a datos y consultas MongoDB.
- `models`: esquemas Mongoose, restricciones e índices.

## Middlewares clave

- `protect`: valida JWT y exige usuario activo con perfil completo.
- `protectIncomplete`: permite flujo de completar perfil.
- `authorizeRoles`: control de acceso por rol (`Admin`, `Teacher`, `Student`, `Parent`).
- `validateRequest`: validación de entrada con Zod.
- `errorHandler`: respuesta de error estándar para toda la API.

## Manejo de errores

Se estandarizó con:

- `AppError` para errores operacionales.
- `errorHandler` global para normalizar respuesta (`status`, `message`, `details`).
- Conversión de errores Mongoose (`CastError`, `ValidationError`, duplicados `11000`).

## Escalabilidad y mantenibilidad

Mejoras aplicadas:

- Validación centralizada por endpoint.
- Lógica de negocio aislada en servicios.
- Documentación OpenAPI en `/api-docs`.
- Índices relevantes en entidades académicas.
- Pruebas de integración para flujos críticos.
- Migración de backend a TypeScript para mejorar seguridad de tipos y mantenimiento.
- Separación entre entrada Node (`src/index.ts`) y entrada serverless (`api/index.ts`) para soportar Vercel sin duplicar la app Express.
