# 🔄 Comparación: Antes vs Después - Arquitectura en Capas

## Introducción

Este documento compara el código **ANTES** (sin capas, sin separación) con el código **DESPUÉS** (con 5 capas independientes y arquitectura profesional).

---

## 📊 Comparación de Estructura

### ANTES (Sin Capas)

```
src/
├── controller/
│   ├── auth.controller.js      ← Mezcla TODO aquí
│   └── user.controller.js
├── model/
│   └── user.model.js
├── routes/
│   ├── auth/
│   │   └── auth.routes.js
│   └── users.routes.js
├── middlewares/
│   └── auth.middleware.js
├── utils/
│   ├── error.js
│   └── jwt.js
└── index.js

❌ Problemas:
- No hay layer de lógica de negocio
- No hay layer de acceso a datos
- Controllers tienen TODA la responsabilidad
- Difícil testear
- Código duplicado
```

### DESPUÉS (Con 5 Capas)

```
src/
├── routes/                    # CAPA 1: Endpoints HTTP
│   ├── auth/
│   │   └── auth.routes.js
│   └── users.routes.js
│
├── controllers/               # CAPA 2: Manejo de HTTP
│   ├── AuthController.js
│   └── UserController.js
│
├── services/                  # CAPA 3: Lógica de Negocio (NUEVA!)
│   ├── AuthService.js
│   └── UserService.js
│
├── repositories/              # CAPA 4: Acceso a Datos (NUEVA!)
│   └── UserRepository.js
│
├── models/                    # CAPA 5: Estructura de Datos
│   └── User.js
│
├── middleware/
│   └── auth.js
│
├── utils/
│   ├── error.js
│   └── jwt.js
│
└── config/
    └── config.js

✅ Ventajas:
- Separación clara de responsabilidades
- Fácil testear cada capa
- Código reutilizable
- Mantenible a largo plazo
- Escalable
```

---

## 🔴 ANTES: Código Monolítico en Controllers

### auth.controller.js (VIEJO - Sin separación)

```javascript
// ❌ MAL: El controller hace TODO
export const register = asyncHandler(async (req, res, next) => {
  const {
    first_name,
    last_name,
    email,
    password,
    password_confirm,
    birthdate,
    document_number,
    requested_role = "student",
  } = req.body;

  // ❌ VALIDACIÓN (línea 20-30)
  if (!first_name || !last_name || !email || !password || !birthdate) {
    throw new AppError("Campos requeridos", 400);
  }
  if (password !== password_confirm) {
    throw new AppError("Contraseñas no coinciden", 400);
  }
  if (password.length < 6) {
    throw new AppError("Mínimo 6 caracteres", 400);
  }

  // ❌ ACCESO A DATOS (línea 31-45)
  let existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email registrado", 400);
  }
  if (document_number) {
    existingUser = await User.findOne({ document_number });
    if (existingUser) {
      throw new AppError("Documento registrado", 400);
    }
  }

  // ❌ LÓGICA DE NEGOCIO (línea 46-52)
  let role = requested_role;
  let status = "pending";
  if (invitation_code) {
    status = "active";
  }

  // ❌ CREAR EN BD (línea 53-61)
  const user = await User.create({
    first_name,
    last_name,
    email,
    password,
    birthdate,
    document_number,
    role,
    status,
  });

  // ❌ GENERAR TOKEN (línea 62-64)
  const token = generateToken(user._id, user.role);

  // ❌ RESPONDER (línea 65-72)
  res.status(201).json({
    status: "success",
    message: "Usuario registrado",
    data: { user: user.toJSON(), token },
  });
});

// ❌ PROBLEMAS:
// - 72 líneas en UN controlador
// - Mezcla validación, BD, lógica, respuesta HTTP
// - ¿Dónde está la validación de datos?
// - ¿Dónde está la lógica de negocio?
// - ¿Dónde está el acceso a datos?
// - Imposible testear sin toda la máquina
// - Código duplicado entre controllers
```

### user.controller.js (VIEJO - Sin separación)

```javascript
// ❌ MAL: Mezcla paginación, filtros, acceso a BD
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { role, status, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // ❌ LÓGICA DE FILTROS (línea 7-15)
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { first_name: { $regex: search, $options: "i" } },
      { last_name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // ❌ ACCESO A BD DIRECTO (línea 16-24)
  const skip = (page - 1) * limit;
  const users = await User.find(filter)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
  const total = await User.countDocuments(filter);

  // ❌ RESPUESTA (línea 25-36)
  res.status(200).json({
    status: "success",
    data: {
      users,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total,
        limit,
      },
    },
  });
});

// ❌ PROBLEMAS:
// - Acceso directo a modelo User
// - Lógica de paginación en controller
// - No hay validación de página/límite
// - Si cambio la BD, cambio el controller
// - No se puede reutilizar la paginación
```

---

## 🟢 DESPUÉS: Arquitectura en Capas (NUEVO)

### 1️⃣ MODELS - Estructura de Datos

```javascript
// models/User.js (SOLO estructura y validaciones)
const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, "El nombre es requerido"],
    minlength: [2, "Mínimo 2 caracteres"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "Email inválido"],
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  // ... más campos
});

// Pre-hooks (únicamente)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return next();
  this.password = await bcryptjs.hash(this.password, 10);
});

// Métodos de instancia (únicamente)
userSchema.methods.matchPassword = async function (pwd) {
  return await bcryptjs.compare(pwd, this.password);
};

// ✅ RESPONSABILIDAD: SOLO estructura de datos
// NO contiene lógica de negocio
// NO accede a otros modelos
// NO tiene métodos complejos
```

### 2️⃣ REPOSITORIES - Acceso a Datos

```javascript
// repositories/UserRepository.js (SOLO CRUD)
class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) query.select("+password");
    return await query;
  }

  async findAll(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const users = await User.find(filters)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(filters);
    return { users, total };
  }

  async emailExists(email) {
    const user = await User.findOne({ email });
    return user !== null;
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }
}

// ✅ RESPONSABILIDAD: SOLO CRUD
// NO valida datos
// NO contiene lógica de negocio
// Retorna documentos puros
// Fácil testear y mockear
```

### 3️⃣ SERVICES - Lógica de Negocio

```javascript
// services/AuthService.js (Reglas de negocio)
class AuthService {
  async register(data) {
    const { email, password, password_confirm, requested_role } = data;

    // ✅ VALIDACIONES DE NEGOCIO
    if (!email || !password) {
      throw new AppError("Campos requeridos", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Email inválido", 400);
    }

    if (password !== password_confirm) {
      throw new AppError("Contraseñas no coinciden", 400);
    }

    if (password.length < 6) {
      throw new AppError("Mínimo 6 caracteres", 400);
    }

    // ✅ VERIFICAR UNICIDAD (usa repository)
    const emailExists = await UserRepository.emailExists(email);
    if (emailExists) {
      throw new AppError("Email ya registrado", 400);
    }

    // ✅ CREAR USUARIO (usa repository)
    const newUser = await UserRepository.create({
      ...data,
      status: "pending",
    });

    // ✅ GENERAR TOKEN (lógica de negocio)
    const token = generateToken(newUser._id, newUser.role);

    // ✅ RETORNAR (NO RESPONDE HTTP)
    return { user: newUser.toJSON(), token };
  }

  async login(email, password) {
    // Validar
    if (!email || !password) {
      throw new AppError("Email y contraseña requeridos", 400);
    }

    // Buscar usuario
    const user = await UserRepository.findByEmail(email, true);
    if (!user) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    // Validar contraseña
    const isValid = await user.matchPassword(password);
    if (!isValid) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    // Validar estado
    if (user.status !== "active") {
      throw new AppError("Cuenta no activa", 403);
    }

    // Actualizar último login
    await UserRepository.updateLastLogin(user._id);

    // Generar token
    const token = generateToken(user._id, user.role);

    return { user: user.toJSON(), token };
  }
}

// ✅ RESPONSABILIDAD: LÓGICA DE NEGOCIO
// Valida datos de negocio
// Coordina repositories
// Lanza errores personalizados
// NO maneja HTTP
// NO accede directo a BD
// Fácil testear con mocks de repository
```

### 4️⃣ CONTROLLERS - Manejo HTTP

```javascript
// controllers/AuthController.js (SOLO HTTP)
class AuthController {
  // POST /api/auth/register
  register = asyncHandler(async (req, res) => {
    // ✅ EXTRAER DATOS
    const registerData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      password_confirm: req.body.password_confirm,
      birthdate: req.body.birthdate,
      document_number: req.body.document_number,
      requested_role: req.body.requested_role || "student",
    };

    // ✅ LLAMAR AL SERVICIO (todo lo demás)
    const result = await AuthService.register(registerData);

    // ✅ RESPONDER HTTP
    res.status(201).json({
      status: "success",
      message: "Usuario registrado exitosamente",
      data: result,
    });
  });

  // POST /api/auth/login
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    res.status(200).json({
      status: "success",
      message: "Login exitoso",
      data: result,
    });
  });

  // GET /api/auth/me
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await AuthService.getCurrentUser(req.userId);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  });
}

// ✅ RESPONSABILIDAD: SOLO HTTP
// Extrae datos de request
// Llama a servicios
// Formatea respuestas
// NO valida datos
// NO accede a BD
// NO tiene lógica de negocio
// Muy limpio, muy legible
```

### 5️⃣ ROUTES - Mapeo de Endpoints

```javascript
// routes/auth/auth.routes.js
import AuthController from "../../controllers/AuthController.js";
import { protect } from "../../middleware/auth.js";

const router = Router();

// Rutas públicas
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Rutas protegidas
router.get("/me", protect, AuthController.getCurrentUser);
router.post("/logout", protect, AuthController.logout);
router.post("/change-password", protect, AuthController.changePassword);

export default router;

// ✅ RESPONSABILIDAD: SOLO MAPEO
// Define endpoints
// Asigna middlewares
// Mapea a controladores
// Muy simple, muy claro
```

---

## 📈 Comparación de Líneas de Código

### ANTES (Sin capas)

```
auth.controller.js:     ~150 líneas (registro + login + logout + cambiar pwd)
user.controller.js:     ~180 líneas (listar + obtener + actualizar + etc)
models/user.model.js:   ~120 líneas
routes/:               ~40 líneas
middlewares/:          ~80 líneas
utils/:                ~100 líneas
─────────────────────────────
TOTAL:                  ~670 líneas

❌ TODO MEZCLADO EN CONTROLLERS
```

### DESPUÉS (Con capas)

```
repositories/UserRepository.js:  ~150 líneas (SOLO CRUD limpio)
services/AuthService.js:         ~120 líneas (lógica de negocio clara)
services/UserService.js:         ~180 líneas (lógica de usuario)
controllers/AuthController.js:   ~80 líneas (SOLO HTTP, muy limpio)
controllers/UserController.js:   ~100 líneas (SOLO HTTP, muy limpio)
models/User.js:                  ~120 líneas (estructura)
routes/:                          ~50 líneas
middleware/:                      ~90 líneas
utils/:                           ~100 líneas
─────────────────────────────
TOTAL:                            ~790 líneas

✅ PERO: Código más organizado, mantenible, testeable
✅ Mejor: Cada parte tiene UNA responsabilidad
✅ Mejor: Se puede reutilizar, cambiar, testear
```

---

## 🧪 Comparación de Testing

### ANTES (Sin capas)

```javascript
// ❌ IMPOSIBLE testear sin todo junto
test("Registrar usuario", async () => {
  // Necesito:
  // - MongoDB corriendo ❌
  // - JWT funcionando ❌
  // - Validaciones ❌
  // - Hash de contraseña ❌
  // - TODO junto

  const res = await request(app).post("/api/auth/register").send({
    /* datos */
  });

  expect(res.status).toBe(201);
  // Prueba LENTA y FRÁGIL
});
```

### DESPUÉS (Con capas)

```javascript
// ✅ Testear cada capa independiente

// Test de Repository (sin mocks)
test("UserRepository.create", async () => {
  const user = await UserRepository.create({
    email: "test@example.com",
    password: "password123",
  });
  expect(user.email).toBe("test@example.com");
});

// Test de Service (con mock de repository)
test("AuthService.register - email duplicado", async () => {
  jest.mock("../repositories/UserRepository");
  UserRepository.emailExists.mockResolvedValue(true);

  await expect(
    AuthService.register({
      email: "existing@example.com",
      password: "password123",
    }),
  ).rejects.toThrow("Email ya registrado");
});

// Test de Controller (con mock de service)
test("AuthController.register", async () => {
  jest.mock("../services/AuthService");
  AuthService.register.mockResolvedValue({
    user: { id: "1" },
    token: "token123",
  });

  const res = await request(app).post("/api/auth/register").send({
    /* datos */
  });

  expect(res.status).toBe(201);
});

// ✅ Tests RÁPIDOS, AISLADOS, CLAROS
```

---

## 🎯 Resumen de Cambios

| Aspecto               | ANTES                     | DESPUÉS                |
| --------------------- | ------------------------- | ---------------------- |
| **Estructura**        | Controladores monolíticos | 5 capas independientes |
| **Responsabilidades** | Mezcladas                 | Claras y separadas     |
| **Testabilidad**      | Difícil (todo junto)      | Fácil (capas aisladas) |
| **Reutilización**     | Código duplicado          | Services reutilizables |
| **Mantenimiento**     | Complejo                  | Simple                 |
| **Escalabilidad**     | Limitada                  | Ilimitada              |
| **Legibilidad**       | Confusa                   | Clara                  |
| **Debugging**         | Difícil                   | Fácil                  |

---

## 🚀 Flujo Actual vs Anterior

### ANTES

```
Request HTTP
    ↓
Route → Controller
    ↓
    ├─ Validar
    ├─ Acceder BD
    ├─ Lógica negocio
    ├─ Hash contraseña
    ├─ Generar token
    └─ Responder HTTP
    ↓
Response
```

**❌ Todo en el controller = difícil de entender, testear, mantener**

### DESPUÉS

```
Request HTTP
    ↓
Route → Controller (extrae datos)
    ↓
    └─ Service (lógica de negocio)
        ↓
        ├─ Valida datos
        └─ Repository (acceso BD)
            ↓
            └─ Model (estructura)
    ↓
Controller (formatea respuesta HTTP)
    ↓
Response
```

**✅ Cada capa tiene UN propósito = fácil de entender, testear, mantener**

---

## 💡 Conclusión

### BENEFICIOS INMEDIATOS

✅ **Código más limpio**: 4 líneas en controller vs 72 líneas antes  
✅ **Fácil testear**: Mockear repository es simple  
✅ **Reutilizable**: Un servicio lo usan múltiples controllers  
✅ **Mantenible**: Cambios localizados a una capa  
✅ **Escalable**: Agregar features sin romper nada  
✅ **Profesional**: Estándar de la industria

### CÓMO EMPEZAR

1. Lee `ARCHITECTURE.md` - Entiende cada capa
2. Lee `IMPLEMENTATION_GUIDE.md` - Cómo usarla
3. Mira los archivos nuevos - Repository, Services
4. Reemplaza controllers viejos con nuevos
5. Escribe tests para cada capa
6. ¡Disfruta el código más limpio! 🎉

---

**Tu proyecto ahora es profesional, escalable y mantenible.**
