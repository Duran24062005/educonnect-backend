# 🔄 Flujos de Autenticación - EduConnect

## Diagrama 1: Flujo de Registro

```
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRO DE USUARIO                         │
└─────────────────────────────────────────────────────────────────┘

[Cliente]
    │
    │ POST /api/auth/register
    │ {email, password, first_name, last_name, birthdate...}
    │
    ▼
[Express Server]
    │
    ├─ Validar campos requeridos
    │  └─ ❌ Si falta campo → Error 400
    │
    ├─ Validar email formato
    │  └─ ❌ Si inválido → Error 400
    │
    ├─ Validar email único
    │  └─ ❌ Si existe → Error 400
    │
    ├─ Validar documento único
    │  └─ ❌ Si existe → Error 400
    │
    ├─ Hash de contraseña
    │  └─ bcryptjs (10 rondas)
    │
    ├─ Crear usuario en BD
    │  └─ status: "pending"
    │     role: "student" (default)
    │
    ├─ Generar JWT Token
    │  {sub: userId, role: "student", iat: ...}
    │
    └─ Retornar token + usuario
        ▼
    [Cliente]
    │
    └─ Guardar token en localStorage
       (o sessionStorage / cookie)
```

---

## Diagrama 2: Flujo de Login

```
┌─────────────────────────────────────────────────────────────────┐
│                       LOGIN DE USUARIO                          │
└─────────────────────────────────────────────────────────────────┘

[Cliente]
    │
    │ POST /api/auth/login
    │ {email, password}
    │
    ▼
[Express Server]
    │
    ├─ Validar email y password presentes
    │  └─ ❌ Si falta → Error 400
    │
    ├─ Buscar usuario por email
    │  └─ ❌ Si no existe → Error 401
    │
    ├─ Incluir contraseña en query (select: +password)
    │
    ├─ Comparar contraseñas
    │  bcryptjs.compare(inputPassword, hashPassword)
    │  └─ ❌ Si no coinciden → Error 401
    │
    ├─ Verificar estado usuario
    │  └─ ❌ Si status !== "active" → Error 403
    │
    ├─ Actualizar last_login
    │
    ├─ Generar JWT Token
    │  {sub: userId, role: role, iat: ...}
    │
    └─ Retornar token + usuario
        ▼
    [Cliente]
    │
    └─ Guardar token
       Token disponible para próximas requests
```

---

## Diagrama 3: Protección de Rutas (Middleware)

```
┌─────────────────────────────────────────────────────────────────┐
│              ACCESO A RUTA PROTEGIDA (/api/auth/me)            │
└─────────────────────────────────────────────────────────────────┘

[Cliente]
    │
    │ GET /api/auth/me
    │ Headers: {Authorization: "Bearer <token>"}
    │
    ▼
[Express - CORS Middleware]
    │
    ├─ Validar origen
    │  └─ ❌ Si no permitido → Error 403
    │
    ▼
[Express - Auth Middleware: protect]
    │
    ├─ Extraer token del header
    │  "Bearer <token>" → token
    │  └─ ❌ Si no existe → Error 401
    │
    ├─ Verificar JWT signature
    │  jwt.verify(token, SECRET)
    │  └─ ❌ Si inválido/expirado → Error 401
    │
    ├─ Obtener claims del token
    │  {sub: userId, role: role}
    │
    ├─ Buscar usuario en BD
    │  User.findById(userId)
    │  └─ ❌ Si no existe → Error 404
    │
    ├─ Verificar estado usuario
    │  └─ ❌ Si status !== "active" → Error 403
    │
    ├─ Inyectar en request
    │  req.user = usuario
    │  req.userId = userId
    │  req.userRole = role
    │
    ▼
[Controlador/Handler]
    │
    ├─ Ejecutar lógica (req.user disponible)
    │
    └─ Retornar respuesta
        ▼
    [Cliente]
    │
    └─ Recibe data del usuario
```

---

## Diagrama 4: Autorización por Rol

```
┌─────────────────────────────────────────────────────────────────┐
│         RUTA PROTEGIDA + AUTORIZACIÓN (admin: true)            │
│              GET /api/users (Solo Admin)                        │
└─────────────────────────────────────────────────────────────────┘

[Cliente con token student]
    │
    │ GET /api/users
    │ Authorization: Bearer <token_student>
    │
    ▼
[Express - Middleware protect]
    │
    ├─ Validar token ✅
    ├─ Obtener usuario ✅
    │
    └─ req.userRole = "student"
        ▼
[Express - Middleware authorize("admin")]
    │
    ├─ Comparar req.userRole con roles permitidos
    │  ❌ "student" ≠ "admin"
    │
    └─ Lanzar Error 403 "No tienes permiso..."
        ▼
    [Cliente]
    │
    └─ Recibe Error 403 Forbidden

────────────────────────────────────────────────────────────────

[Cliente con token admin]
    │
    │ GET /api/users
    │ Authorization: Bearer <token_admin>
    │
    ▼
[Express - Middleware protect]
    │
    ├─ Validar token ✅
    ├─ Obtener usuario ✅
    │
    └─ req.userRole = "admin"
        ▼
[Express - Middleware authorize("admin")]
    │
    ├─ Comparar req.userRole con roles permitidos
    │  ✅ "admin" = "admin"
    │
    └─ Permitir siguiente middleware
        ▼
[Controlador]
    │
    ├─ Ejecutar lógica (listar usuarios)
    │
    └─ Retornar lista de usuarios
        ▼
    [Cliente]
    │
    └─ Recibe lista de usuarios
```

---

## Diagrama 5: Ciclo de Vida Token JWT

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT TOKEN LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

[Generación]
    │
    ├─ User login exitoso
    │
    └─ generateToken(userId, role)
        │
        ├─ Crear payload
        │  {sub: userId, role: role, iat: Math.floor(Date.now/1000)}
        │
        ├─ Firmar con SECRET
        │  jwt.sign(payload, SECRET, {expiresIn: "7d"})
        │
        └─ Retornar token
            │
            ▼
        [Cliente]
        │
        ├─ localStorage.setItem("token", token)
        │  O sessionStorage, cookies, etc.
        │
        ▼
    [Uso - Próximas 7 días]
        │
        ├─ Cliente incluye en cada request
        │  Authorization: Bearer <token>
        │
        ├─ Server verifica
        │  jwt.verify(token, SECRET)
        │  └─ ✅ Válido → Permitir acceso
        │
        ▼
    [Expiración - Después de 7 días]
        │
        ├─ jwt.verify() falla
        │
        └─ Error: "Token expirado"
            │
            ▼
        [Cliente]
        │
        ├─ Detecta expiración
        │
        └─ Redirige a /login
            │
            ▼
        [Usuario]
        │
        └─ Ingresa credenciales nuevamente
            │
            └─ Obtiene nuevo token
```

---

## Diagrama 6: Flujo de Aprobación (Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│            PROCESO DE APROBACIÓN DE USUARIOS                    │
└─────────────────────────────────────────────────────────────────┘

[Usuario A registra]
    │
    ├─ POST /api/auth/register
    │
    └─ Crea usuario con status: "pending"
        │
        ▼
    [Base de Datos]
    │
    └─ new User {status: "pending", role: undefined}
        │
        ▼
    [Admin Dashboard]
    │
    ├─ GET /api/users/pending
    │  (Requiere token admin)
    │
    └─ Obtiene lista de pendientes
        │
        ├─ Usuario A - Juan Pérez (juan@example.com)
        ├─ Usuario B - María López (maria@example.com)
        └─ ...
        │
        ▼
    [Admin revisa y aprueba]
    │
    ├─ POST /api/users/<id_juan>/approve
    │ {role: "student"}
    │
    ├─ Validar rol
    ├─ Actualizar usuario
    │  ├─ status: "active"
    │  ├─ role: "student"
    │  └─ updated_by: adminId
    │
    ▼
    [Base de Datos]
    │
    └─ User Juan Pérez {status: "active", role: "student"}
        │
        ▼
    [Usuario A]
    │
    ├─ Ahora puede hacer login
    │ ❌ Antes: status="pending" → Error 403
    │ ✅ Después: status="active" → Login OK
    │
    └─ Obtiene JWT y accede a plataforma
```

---

## Diagrama 7: Comparación Contraseña

```
┌─────────────────────────────────────────────────────────────────┐
│           PROCESO DE HASHING Y COMPARACIÓN                      │
└─────────────────────────────────────────────────────────────────┘

[Registro]
    │
    ├─ Usuario ingresa password: "miPassword123"
    │
    ▼
[Server - Before Save]
    │
    ├─ Pre-hook Mongoose
    │  user.pre('save', async (next) => {
    │    const salt = await bcryptjs.genSalt(10)
    │    this.password = await bcryptjs.hash(password, salt)
    │  })
    │
    ├─ Procesar
    │  ├─ Generar salt (10 rondas)
    │  ├─ Hash: password + salt
    │  └─ Resultado: $2b$10$...xyz (60 caracteres)
    │
    ▼
    [Base de Datos]
    │
    └─ Guardar: password: "$2b$10$...xyz"
        │
        ▼
    [Password NUNCA en texto plano]


[Login - Usuario intenta acceder]
    │
    ├─ Usuario ingresa: "miPassword123"
    │
    ▼
    [Server]
    │
    ├─ Buscar usuario
    │ user = User.findOne({email}).select("+password")
    │ (select("+password") porque por defecto no se retorna)
    │
    ├─ Obtener hash de BD
    │ storedHash = "$2b$10$...xyz"
    │
    ├─ Usar método matchPassword
    │  bcryptjs.compare(inputPassword, storedHash)
    │
    ├─ Comparar
    │  └─ hash("miPassword123" + salt) === storedHash
    │
    ▼
    ├─ ✅ Coinciden → Login exitoso → JWT
    │
    └─ ❌ No coinciden → Error 401 "Credenciales incorrectas"
```

---

## Tabla de Códigos de Error

| Código  | Significado  | Causa                                                           |
| ------- | ------------ | --------------------------------------------------------------- |
| **400** | Bad Request  | Email/documento duplicado, campos faltantes, validación fallida |
| **401** | Unauthorized | Token inválido/expirado, credenciales incorrectas               |
| **403** | Forbidden    | Usuario no activo, sin permiso de rol, acceso denegado          |
| **404** | Not Found    | Usuario no existe                                               |
| **500** | Server Error | Error de servidor                                               |

---

## Estados de Usuario

```
        ┌──────────┐
        │ PENDING  │  ← Usuario registra
        └─────┬────┘
              │ Admin aprueba + asigna rol
              │
        ┌─────▼────┐
        │  ACTIVE  │  ← Usuario puede usar plataforma
        └─────┬────┘
              │
        ┌─────▼────┐
        │ INACTIVE │  ← Usuario desactivado
        └──────────┘

        ┌──────────┐
        │ BLOCKED  │  ← Usuario bloqueado (violación)
        └──────────┘
```

---

## Roles y Permisos

| Rol          | Puede Hacer                                              | Restricciones                       |
| ------------ | -------------------------------------------------------- | ----------------------------------- |
| **student**  | Ver perfil, hacer tareas, ver calificaciones             | No puede crear aulas, calificar     |
| **teacher**  | Crear aulas, subir contenido, calificar, ver estudiantes | No puede modificar otros profesores |
| **admin**    | Todo                                                     | Acceso completo                     |
| **guardian** | Ver calificaciones del estudiante, contactar profesor    | Lectura principalmente              |

---

## Secuencia de Mensajes (Request-Response)

```
CLIENT                              SERVER                    DATABASE
  │                                   │                           │
  ├─ POST /auth/register ────────────►│                           │
  │                                   ├─ Validar datos            │
  │                                   ├─ Hash password            │
  │                                   ├─ Crear usuario ──────────►│
  │                                   │                           │
  │                                   │◄─ Usuario creado         │
  │                                   ├─ Generar JWT             │
  │◄─ {token, user} ─────────────────┤                           │
  │                                   │                           │
  ├─ GET /auth/me ───────────────────►│                           │
  │ Authorization: Bearer token       ├─ Verificar token         │
  │                                   ├─ Buscar usuario ────────►│
  │                                   │                           │
  │                                   │◄─ User data             │
  │◄─ {user} ─────────────────────────┤                           │
  │                                   │                           │
```

---

¡Estos diagramas te ayudarán a entender los flujos de autenticación! 🎯
