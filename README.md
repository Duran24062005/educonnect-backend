# EduConnect Backend

API HTTP de EduConnect para autenticacion, ciclo de cuenta, estructura academica, grupos, evaluaciones, actividades, analitica y archivos subidos.

Este repositorio es independiente de `educonnect-portal`. Comparten dominio de negocio y contratos HTTP, pero no comparten historial Git, ciclo de cambios ni documentacion operativa. Cualquier decision de frontend debe documentarse en su propio repositorio, aunque consuma endpoints definidos aqui.

## Alcance del repositorio

Este backend es responsable de:

- exponer la API REST consumida por portal y futuras integraciones
- autenticar usuarios y emitir JWT
- aplicar permisos por rol y estado de cuenta
- persistir datos academicos en MongoDB
- servir uploads locales o temporales segun el runtime
- centralizar reglas de negocio del dominio academico
- publicar Swagger para exploracion de endpoints

Este backend no es responsable de:

- routing del portal
- estado global del frontend
- cache de navegador
- division de chunks del bundle web
- componentes visuales o decisiones de UX

## Stack

- Node.js 20
- Express 5
- MongoDB + Mongoose
- JWT
- Zod
- Swagger UI
- Jest + Supertest
- TypeScript
- Docker + Docker Compose
- Vercel serverless entrypoint

## Dominios cubiertos hoy

- `auth`: registro, login, perfil, recuperacion y estado de cuenta
- `users`: administracion de usuarios y aprobaciones
- `students`: operaciones centradas en estudiantes
- `academic`: years, periods, grades, areas y aulas
- `groups`: grupos, asignaciones, detalle consolidado y enrolamientos relacionados
- `evaluations`: notas, resultados y estadisticas
- `analytics`: dashboards agregados para admin y teacher
- `activities`: actividades, entregas y archivos
- `notifications`: notificaciones in-app, conteo de no leidas y anuncios dirigidos

## Arquitectura actual

La base sigue una arquitectura por capas:

`routes -> controllers -> services -> repositories -> models`

Estructura principal:

```text
src/
  app.ts                  # Configuracion de Express y montaje de routers
  index.ts                # Bootstrap del servidor Node y conexion a MongoDB
  config/                 # Configuracion y conexion
  constants/              # Constantes de dominio
  controllers/            # Adaptacion HTTP
  docs/                   # Swagger/OpenAPI
  middlewares/            # Auth, roles, uploads, errores, validacion
  models/                 # Esquemas Mongoose
  repositories/           # Acceso a datos
  routes/                 # Rutas por modulo
  schemas/                # Esquemas de apoyo
  services/               # Reglas de negocio
  uploads/                # Archivos locales en desarrollo
  utils/                  # Helpers compartidos
  validators/             # Validacion Zod por endpoint
  types/                  # Tipos compartidos y extensiones globales
api/                      # Entrypoint serverless para Vercel
scripts/                  # Seeds y scripts utilitarios
database/                 # Seeds/documentacion de datos fuera de runtime HTTP
tests/                    # Integracion end-to-end contra app Express
docs/                     # Documentacion del repositorio
prds/                     # Documentos funcionales/producto ligados a este repo
```

## Puntos de entrada y rutas base

Puntos de entrada:

- `src/index.ts`: inicia servidor Node tradicional y conecta MongoDB
- `src/app.ts`: configura middlewares, CORS, uploads, Swagger y routers
- `api/index.ts`: entrada serverless para despliegues en Vercel

Rutas base publicadas:

- `GET /`: metadata minima de la API
- `GET /health`: healthcheck simple
- `GET /api-docs`: Swagger UI
- `GET /uploads/*`: archivos servidos por Express

Routers montados:

- `/api/auth`
- `/api/users`
- `/api/students`
- `/api/academic`
- `/api/groups`
- `/api/evaluations`
- `/api/analytics`
- `/api/activities`
- `/api/notifications`

## Endpoints agregados orientados a performance

La optimizacion documentada en [`prds/009-performance-loading-optimization.md`](./prds/009-performance-loading-optimization.md) introdujo endpoints pensados para reducir waterfalls del portal, sin reemplazar rutas legadas:

- `GET /api/analytics/admin/dashboard-summary`
- `GET /api/analytics/teacher/me/dashboard-summary`
- `GET /api/groups/:group_id/detail-summary`

Responsabilidad de este repo:

- calcular y servir los payloads agregados
- mantener compatibilidad con endpoints existentes
- aplicar cache de lectura en memoria cuando corresponda

Responsabilidad del portal:

- decidir que vistas consumen estos agregados
- manejar cache cliente, placeholders y lazy loading

## Requisitos

- Node.js 20 recomendado
- Yarn clasico disponible
- MongoDB local o remoto
- Docker opcional para levantar MongoDB rapido

## Instalacion

```bash
yarn install
cp .env.example .env
```

## Variables de entorno

La plantilla base vive en [`.env.example`](./.env.example).

Variables principales:

- `NODE_ENV`: `development`, `test` o `production`
- `PORT`: puerto del servidor HTTP
- `DATABASE_URL`: cadena principal de conexion MongoDB
- `MONGO_URI_CLOUD`: alternativa legada si no se usa `DATABASE_URL`
- `MONGO_USERNAME`: usuario esperado por el compose local
- `MONGO_PASSWORD`: password esperado por el compose local
- `JWT_SECRET`: secreto para firma de tokens
- `JWT_EXPIRE`: duracion del token
- `CORS_ORIGIN`: lista separada por comas de origins permitidos
- `FRONTEND_URL`: fallback usado para CORS y links de email
- `EMAIL_API_BASE_URL`: servicio o endpoint que recibe solicitudes de envio de email

Notas importantes:

- En `production`, `JWT_SECRET` es obligatorio.
- Si `CORS_ORIGIN` no esta definido, el backend intenta usar `FRONTEND_URL`.
- Si no existe `DATABASE_URL`, la app cae al Mongo local del `docker-compose.yml`.

## Desarrollo local

1. Levantar MongoDB local si lo necesitas:

```bash
docker compose up -d mongodb
```

2. Iniciar la API:

```bash
yarn dev
```

Comandos utiles:

```bash
yarn typecheck
yarn build
```

3. Verificar:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/api-docs`
- Health: `http://localhost:8000/health`

Modo produccion local:

```bash
yarn build
yarn start
```

## Docker Compose

El compose del repo levanta:

- `backend` en `http://localhost:8000`
- `mongodb` en `localhost:27017`

Comando:

```bash
docker compose up --build
```

## Seeds y datos de prueba

Scripts disponibles:

- `yarn seed`: datos base de ejemplo
- `yarn seed:analytics`: dataset enfocado en dashboards y endpoints agregados
- `yarn seed:test-users`: datos de prueba orientados a autenticacion/usuarios

Todos los seeds viven en `educonnect-backend/scripts/`.

Usalos solo en entornos de desarrollo o pruebas controladas.

## Uploads y runtime

Los archivos se sirven desde `/uploads`.

Comportamiento segun runtime:

- desarrollo / servidor tradicional: archivos bajo `src/uploads`
- runtimes serverless detectados (`VERCEL`, `AWS_LAMBDA_FUNCTION_NAME`, `LAMBDA_TASK_ROOT`): archivos bajo `/tmp/educonnect-uploads`

Esto implica:

- en serverless los uploads son efimeros
- `/tmp` no debe asumirse como almacenamiento persistente
- si el producto necesita permanencia real, debe integrarse un storage externo

## Deploy en Vercel

El repositorio soporta despliegue en Vercel usando una entrada serverless dedicada:

- `api/index.ts`: asegura conexion a MongoDB y delega la request a la app Express
- `vercel.json`: enruta `/(.*)` hacia `api/index.ts`
- `src/index.ts`: evita ejecutar `app.listen()` cuando corre dentro de Vercel

Esto significa que:

- el deploy en Vercel no depende de `src/index.ts` como punto de entrada HTTP
- las funciones reutilizan la app Express existente
- la conexion a base se inicializa por request cold start y se reutiliza mientras el runtime siga vivo

## Testing

Comando:

```bash
yarn test
```

Cobertura actual de alto nivel:

- autenticacion
- usuarios / estudiantes
- actividades
- notificaciones y anuncios
- endpoints agregados de performance

Los tests viven en `tests/` y usan `mongodb-memory-server` para aislar la base.

## Documentacion interna

Lectura recomendada:

- [`docs/README.md`](./docs/README.md)
- [`docs/repository-context.md`](./docs/repository-context.md)
- [`docs/Architecture.md`](./docs/Architecture.md)
- [`docs/api_docs.md`](./docs/api_docs.md)
- [`prds/010-notifications-announcements.md`](./prds/010-notifications-announcements.md)
- [`prds/009-performance-loading-optimization.md`](./prds/009-performance-loading-optimization.md)

## Convenciones operativas

- Si cambia un contrato HTTP, actualizar Swagger y la documentacion del backend.
- Si una decision impacta solo UX o cache cliente, documentarla en `educonnect-portal`, no aqui.
- Si una funcionalidad cruza ambos repositorios, documentar el contrato en backend y el consumo en frontend por separado.
- No asumir que el portal despliega al mismo tiempo que esta API; mantener compatibilidad cuando sea posible.

## Seguridad y produccion

- usar un `JWT_SECRET` fuerte y rotado fuera del repo
- restringir `CORS_ORIGIN` a dominios confiables
- monitorear tiempos de respuesta de endpoints agregados
- agregar rate limiting y observabilidad antes de trafico alto
- mover uploads a storage persistente si se despliega en serverless
