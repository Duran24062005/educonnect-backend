# 🔐 Guía de Autenticación y Docker - EduConnect

## 📋 Tabla de Contenidos

1. [Docker Setup](#docker-setup)
2. [Autenticación](#autenticación)
3. [Endpoints](#endpoints)
4. [Protección de Rutas](#protección-de-rutas)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🐳 Docker Setup

### Requisitos Previos

- Docker instalado
- Docker Compose instalado

### Configuración Inicial

1. **Copiar variables de entorno:**

```bash
cp .env.example .env
```

2. **Editar `.env` (opcional para desarrollo):**

```env
PORT=8000
NODE_ENV=development
MONGO_URI_CLOUD=                    # Dejar vacío para usar MongoDB local
JWT_SECRET=tu-secreto-cambiar-en-produccion
```

### Iniciar con Docker Compose

```bash
# Iniciar servicios (API + MongoDB)
docker-compose up

# Iniciar en background
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener servicios
docker-compose down

# Limpiar volúmenes (elimina datos)
docker-compose down -v
```

### Acceder a MongoDB (Local)

```bash
# Desde dentro del contenedor
docker-compose exec mongodb mongosh -u admin -p admin123

# O usando MongoDB Compass
# Connection String: mongodb://admin:admin123@localhost:27017/?authSource=admin
```

### Construir imagen manualmente

```bash
# Construir imagen
docker build -t educonnect-api:1.0 .

# Ejecutar contenedor
docker run -p 8000:8000 \
  -e JWT_SECRET=tu-secreto \
  -e MONGO_URI_CLOUD=mongodb://... \
  educonnect-api:1.0
```

---

## 🔐 Autenticación

### Características Implementadas

- ✅ Registro de usuarios con validaciones
- ✅ Login con JWT
- ✅ Protección de rutas
- ✅ Autorización por rol
- ✅ Cambio de contraseña
- ✅ Hash de contraseñas con bcryptjs
- ✅ Tokens con expiración

### Estructura de JWT

El token contiene:

```json
{
  "sub": "user_id",
  "role": "student|teacher|admin|guardian",
  "iat": 1234567890
}
```

### Roles Disponibles

- **student**: Estudiante
- **teacher**: Docente
- **admin**: Administrador
- **guardian**: Padre/Acudiente

### Estados de Usuario

- **pending**: Pendiente de aprobación
- **active**: Activo
- **inactive**: Inactivo
- **blocked**: Bloqueado

---

## 📡 Endpoints

### Autenticación (sin protección)

#### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "birthdate": "2005-06-15",
  "document_number": "1234567890",
  "requested_role": "student"
}
```

**Respuesta exitosa:**

```json
{
  "status": "success",
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "_id": "...",
      "first_name": "Juan",
      "email": "juan@example.com",
      "role": "student",
      "status": "pending"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa:**

```json
{
  "status": "success",
  "message": "Login exitoso",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Autenticación (protegidas)

#### Obtener usuario actual

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Cambiar contraseña

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "password123",
  "new_password": "newpassword456",
  "new_password_confirm": "newpassword456"
}
```

### Usuarios

#### Obtener todos (Admin)

```http
GET /api/users?page=1&limit=10&role=student&status=active
Authorization: Bearer <admin_token>
```

#### Obtener usuario por ID

```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Actualizar usuario

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Juan Carlos",
  "last_name": "Pérez López"
}
```

#### Obtener pendientes (Admin)

```http
GET /api/users/pending
Authorization: Bearer <admin_token>
```

#### Aprobar usuario (Admin)

```http
POST /api/users/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "student"
}
```

#### Cambiar estado (Admin)

```http
PATCH /api/users/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "active"
}
```

#### Eliminar usuario (Admin)

```http
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

---

## 🛡️ Protección de Rutas

### Middleware `protect`

Verifica que el usuario esté autenticado:

```javascript
app.get("/api/private-route", protect, (req, res) => {
  // req.user = usuario autenticado
  // req.userId = ID del usuario
  // req.userRole = Rol del usuario
});
```

### Middleware `authorize`

Verifica roles específicos:

```javascript
app.get("/api/admin-route", protect, authorize("admin"), (req, res) => {
  // Solo admins
});

app.get(
  "/api/teacher-route",
  protect,
  authorize("teacher", "admin"),
  (req, res) => {
    // Profesores o admins
  },
);
```

### Middleware `optionalAuth`

Autenticación opcional (no lanza error):

```javascript
app.get("/api/public-route", optionalAuth, (req, res) => {
  // req.user existirá si el usuario está autenticado
  // Si no está autenticado, continúa normalmente
});
```

---

## 💡 Ejemplos de Uso

### cURL

#### Registrar usuario

```bash
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
```

#### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

#### Acceder a ruta protegida

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### JavaScript (Fetch)

```javascript
// Registrar
const registerResponse = await fetch(
  "http://localhost:8000/api/auth/register",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: "Juan",
      last_name: "Pérez",
      email: "juan@example.com",
      password: "password123",
      password_confirm: "password123",
      birthdate: "2005-06-15",
    }),
  },
);

const { data } = await registerResponse.json();
const token = data.token;

// Usar token en siguiente request
const userResponse = await fetch("http://localhost:8000/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});

const user = await userResponse.json();
console.log(user);
```

### Axios

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Registrar
const { data: registerData } = await api.post("/auth/register", {
  first_name: "Juan",
  last_name: "Pérez",
  email: "juan@example.com",
  password: "password123",
  password_confirm: "password123",
  birthdate: "2005-06-15",
});

const token = registerData.data.token;

// Usar token
const { data: userData } = await api.get("/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 🔍 Debugging

### Ver logs

```bash
# Docker
docker-compose logs -f api

# O en local
npm run dev
```

### Verificar MongoDB

```bash
docker-compose exec mongodb mongosh -u admin -p admin123
use educonnect
db.users.find()
```

### Probar endpoints con Postman

1. Abrir Postman
2. Importar endpoints
3. En "Auth" tab → Bearer Token → pegar token
4. Ejecutar requests

---

## ⚠️ Seguridad en Producción

- [ ] Cambiar `JWT_SECRET` a un valor seguro
- [ ] Usar HTTPS
- [ ] Configurar CORS apropiadamente
- [ ] Usar MongoDB Atlas (nube)
- [ ] Implementar rate limiting
- [ ] Implementar CSRF protection
- [ ] Usar headers de seguridad (helmet)
- [ ] Validar inputs más estrictamente

---

## 📚 Recursos Adicionales

- [JWT.io](https://jwt.io)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
