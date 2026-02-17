<p align="center">
  <a href="https://edu-connect-beta.vercel.app/">
    <img src="https://edu-connect-beta.vercel.app/img/EduConectLogo.png" height="96">
    <h1 align="center">EduConnect — Backend</h1>
  </a>
</p>

<p align="center">API REST para la plataforma educativa EduConnect, construida con Node.js, Express y MongoDB.</p>

<br/>

EduConnect es una plataforma educativa integral diseñada para facilitar la gestión académica y mejorar la comunicación entre estudiantes, maestros y padres. Este proyecto es una iniciativa abierta, donada a la institución educativa, con el objetivo de proporcionar a los estudiantes una oportunidad de aprendizaje práctico en desarrollo de software.

---

## Tecnologías

- **Runtime**: Node.js 20
- **Framework**: Express 5
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcryptjs, CORS, validación con validator.js
- **Contenedores**: Docker + Docker Compose
- **Despliegue**: Vercel (serverless)

---

## Arquitectura

El proyecto implementa una **arquitectura en 5 capas** siguiendo los principios SOLID:

```
Routes → Controllers → Services → Repositories → Models
```

| Capa             | Responsabilidad                            |
| ---------------- | ------------------------------------------ |
| **Routes**       | Definir endpoints y mapear a controllers   |
| **Controllers**  | Extraer datos del request y responder HTTP |
| **Services**     | Lógica de negocio y validaciones           |
| **Repositories** | Operaciones CRUD con la base de datos      |
| **Models**       | Esquema Mongoose, hooks y métodos          |

Para más detalles, ver [`docs/Architecture.md`](docs/Architecture.md).

---

## Estructura del Proyecto

```
src/
├── config/          # Configuración de la app y conexión a BD
├── controllers/     # Manejo de requests HTTP
├── services/        # Lógica de negocio
├── repositories/    # Acceso a datos (CRUD)
├── models/          # Esquemas Mongoose
├── middlewares/     # Autenticación y autorización
├── routes/          # Definición de endpoints
│   └── auth/
└── utils/           # Utilidades (JWT, manejo de errores)
```

---

## Instalación y Uso

### Requisitos Previos

- Node.js 20+ o Docker

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Duran24062005/educonnect-backend.git
cd educonnect-backend
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
PORT=8000
NODE_ENV=development
MONGO_URI_CLOUD=           # URI de MongoDB Atlas (dejar vacío para usar MongoDB local)
JWT_SECRET=cambia-esto-en-produccion
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
EMAIL_API_BASE_URL=http://localhost:8001
```

### 3. Iniciar el Servidor

**Opción A — Docker Compose (recomendado):**

```bash
docker-compose up
```

Esto levanta la API y una instancia local de MongoDB automáticamente.

**Opción B — Local sin Docker:**

```bash
yarn install
yarn dev
```

La API estará disponible en `http://localhost:8000`.

---

## Endpoints

### Autenticación (públicos)

| Método | Ruta                 | Descripción        |
| ------ | -------------------- | ------------------ |
| POST   | `/api/auth/register` | Registrar usuario  |
| POST   | `/api/auth/login`    | Login, retorna JWT |

### Autenticación (requieren token)

| Método | Ruta                        | Descripción         |
| ------ | --------------------------- | ------------------- |
| GET    | `/api/auth/me`              | Usuario autenticado |
| POST   | `/api/auth/logout`          | Logout              |
| POST   | `/api/auth/change-password` | Cambiar contraseña  |

### Usuarios (requieren token)

| Método | Ruta                       | Rol requerido | Descripción                |
| ------ | -------------------------- | ------------- | -------------------------- |
| GET    | `/api/users`               | admin         | Listar usuarios (paginado) |
| GET    | `/api/users/:id`           | autenticado   | Obtener usuario por ID     |
| PUT    | `/api/users/:id`           | autenticado   | Actualizar perfil          |
| GET    | `/api/users/admin/pending` | admin         | Usuarios pendientes        |
| POST   | `/api/users/:id/approve`   | admin         | Aprobar usuario            |
| PATCH  | `/api/users/:id/status`    | admin         | Cambiar estado             |
| DELETE | `/api/users/:id`           | admin         | Eliminar usuario           |
| GET    | `/api/users/admin/stats`   | admin         | Estadísticas de usuarios   |

### Sistema

| Método | Ruta      | Descripción            |
| ------ | --------- | ---------------------- |
| GET    | `/`       | Info general de la API |
| GET    | `/health` | Health check           |

---

## Roles y Estados

**Roles disponibles:** `student`, `teacher`, `admin`, `guardian`

**Estados de usuario:** `pending` → `active` | `inactive` | `blocked`

Los usuarios recién registrados quedan en estado `pending` hasta que un administrador los apruebe vía `POST /api/users/:id/approve`.

---

## Autenticación

Incluir el token JWT en el header de cada request protegido:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login o al registrarse. Por defecto expira en 7 días.

---

## Ejemplo Rápido

```bash
# Registrar usuario
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "birthdate": "2005-06-15",
    "document_number": "1234567890"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "juan@example.com", "password": "password123"}'

# Acceder a ruta protegida
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Documentación Adicional

| Archivo                                                                      | Contenido                       |
| ---------------------------------------------------------------------------- | ------------------------------- |
| [`docs/Architecture.md`](docs/Architecture.md)                               | Arquitectura en capas detallada |
| [`docs/auth_guide.md`](docs/auth_guide.md)                                   | Guía de autenticación y Docker  |
| [`docs/authentication_flow.md`](docs/authentication_flow.md)                 | Diagramas de flujo              |
| [`docs/SystemArtifacts.md`](docs/SystemArtifacts.md)                         | Requerimientos del sistema      |
| [`prds/002-user-registration-roles.md`](prds/002-user-registration-roles.md) | PRD de registro y roles         |

---

## Despliegue en Vercel

```bash
# Con Vercel CLI
npm i -g vercel
vercel
```

El archivo `vercel.json` ya incluye la configuración necesaria. Recuerda configurar las variables de entorno en el dashboard de Vercel, especialmente `MONGO_URI_CLOUD` y `JWT_SECRET`.

---

## Seguridad en Producción

- [ ] Cambiar `JWT_SECRET` a un valor aleatorio y seguro
- [ ] Usar MongoDB Atlas con `MONGO_URI_CLOUD`
- [ ] Configurar `FRONTEND_URL` con el dominio real
- [ ] Habilitar HTTPS
- [ ] Implementar rate limiting
- [ ] Revisar configuración de CORS

---

## Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Sigue la arquitectura en capas existente (Model → Repository → Service → Controller → Route)
4. Envía un pull request describiendo tus cambios

---

## Licencia

Este proyecto está licenciado bajo licencia propietaria. Consulta el archivo `LICENSE` para más detalles.

---

## Links

- [Diseño en Figma](https://www.figma.com/design/sZwZK7RJD6PLdKyMhA1Im9/EduConnect_Design?node-id=0-1&t=F0u7MoYU4YI4xUFE-1)
- [Documentación técnica](https://docs.google.com/document/d/19EcU7E8YwuDrTcl3ugjGeiJGplnF74G8ZeTQioHba-8/edit?usp=sharing)
- [Frontend (EduConnect)](https://edu-connect-beta.vercel.app/)

## Docs

- [Docs Folder](https://docs.google.com/document/d/19EcU7E8YwuDrTcl3ugjGeiJGplnF74G8ZeTQioHba-8/edit?usp=sharing)
- [Figma](https://www.figma.com/design/sZwZK7RJD6PLdKyMhA1Im9/EduConnect_Design?node-id=0-1&t=F0u7MoYU4YI4xUFE-1)
