# Arquitectura Backend - EduConnect

## Visión general

El backend es un monolito modular orientado a mantenibilidad y escalabilidad. Un único proceso Express conserva una única conexión a MongoDB y un único despliegue, mientras cada dominio encapsula su entrada HTTP y su lógica de negocio.

`app -> módulo -> controller -> service -> repository/model`

Además, se incorporan capas transversales:

- `middlewares`: auth, autorización por roles, validación y manejo global de errores.
- `shared`: capacidades transversales y contratos comunes.
- `config`: configuración centralizada de entorno y conexión a MongoDB.
- `docs`: OpenAPI/Swagger y documentación funcional.
- `tests`: pruebas de integración con Jest + Supertest.
- `types`: tipos compartidos y extensiones de Express/Mongoose.
- `api`: entrada serverless para Vercel, separada del bootstrap Node tradicional.

## Estructura modular de `src/`

```text
src/
  app.ts
  index.ts
  config/
  docs/
  middlewares/
  modules/
    auth/                    # auth.routes, AuthController, AuthService, validators
    users/ academic/ groups/  # módulos de dominio
    students/ guardians/
    evaluations/ analytics/
    activities/ notifications/
    attendance/ calendar/
    institutions/ audit/ imports/
    index.ts                  # registro de módulos HTTP
  models/
  repositories/
  shared/                    # scope, email, validación y storage común
  types/
  utils/
api/
database/
tests/
```

## Responsabilidades

- `modules/<domain>`: agrupa rutas, controladores, servicios y validadores de un dominio.
- `index.ts` de cada módulo: expone su router y el prefijo HTTP; no contiene lógica de negocio.
- `src/modules/index.ts`: único registro de composición de routers.
- `controllers`: adapta request/response y delega en servicios.
- `services`: reglas de negocio y orquestación del dominio.
- `repositories`: acceso a datos y consultas MongoDB.
- `models`: esquemas Mongoose, restricciones e índices.
- `shared`: solo capacidades usadas por más de un módulo; no debe alojar reglas propias de un dominio.

## Reglas de dependencia

- `app.ts` conoce solamente el registro de módulos, middlewares globales y healthchecks.
- Un módulo puede usar repositorios/modelos compartidos y servicios públicos de otro módulo cuando exista una dependencia de dominio real.
- Un módulo no debe importar rutas ni controladores de otro módulo.
- Las dependencias entre dominios son llamadas directas en memoria; no se crean requests HTTP internos.
- La persistencia permanece compartida en esta fase para evitar duplicar modelos y mantener una fuente de verdad.

## Cómo agregar un módulo

1. Crear `src/modules/<domain>/` con ruta, controller, service y validators.
2. Crear su `index.ts` con `name`, `basePath` y `router`.
3. Agregar el módulo a `src/modules/index.ts`.
4. Mantener middleware de auth, tenant y validación en la ruta correspondiente.
5. Agregar o actualizar pruebas y Swagger si el contrato cambia.

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

Beneficios de la organización modular:

- Validación centralizada por endpoint.
- Lógica de negocio aislada en servicios.
- Documentación OpenAPI en `/api-docs`.
- Índices relevantes en entidades académicas.
- Pruebas de integración para flujos críticos.
- Migración de backend a TypeScript para mejorar seguridad de tipos y mantenimiento.
- Separación entre entrada Node (`src/index.ts`) y entrada serverless (`api/index.ts`) para soportar Vercel sin duplicar la app Express.
- Nuevos dominios aislados por feature sin cambiar contratos HTTP.
- Composición explícita de la API para auditar fácilmente qué módulos están publicados.
