# 🔧 Guía de Implementación: Arquitectura en Capas

## Qué Cambió

Tu proyecto anterior tenía:

- ❌ Controladores con mucha lógica
- ❌ Directamente accedían a modelos
- ❌ Mezcla de responsabilidades
- ❌ Difícil de testear

Ahora tiene:

- ✅ Capas claramente separadas
- ✅ Responsabilidades únicas
- ✅ Fácil de testear
- ✅ Código profesional y escalable

---

## 📁 Estructura Nueva

```
src/
├── routes/                    # CAPA 1: Endpoints
├── controllers/               # CAPA 2: Manejo HTTP
├── services/                  # CAPA 3: Lógica de negocio
├── repositories/              # CAPA 4: Acceso a datos (NUEVO!)
├── models/                    # CAPA 5: Estructura de datos
├── middleware/
├── utils/
└── config/
```

---

## 🚀 Cómo Usar Esta Arquitectura

### Caso 1: Crear nuevo Endpoint

**Paso 1: Crear Route** (`routes/` → Controller)

```javascript
// routes/classroom.routes.js
router.post(
  "/classrooms",
  protect,
  authorize("teacher"),
  ClassroomController.createClassroom,
);
```

**Paso 2: Crear Controller** (HTTP → Service)

```javascript
// controllers/ClassroomController.js
createClassroom = asyncHandler(async (req, res) => {
  const data = {
    name: req.body.name,
    description: req.body.description,
    teacher_id: req.userId,
  };

  const classroom = await ClassroomService.createClassroom(data, req.userId);

  res.status(201).json({
    status: "success",
    data: { classroom },
  });
});
```

**Paso 3: Crear Service** (Lógica de negocio)

```javascript
// services/ClassroomService.js
async createClassroom(data, teacherId) {
    // Validar
    if (!data.name) throw new AppError('Nombre requerido', 400);
    if (data.name.length < 3) throw new AppError('Mínimo 3 caracteres', 400);

    // Verificar que sea profesor
    const user = await UserRepository.findById(teacherId);
    if (user.role !== 'teacher') {
        throw new AppError('Solo profesores pueden crear aulas', 403);
    }

    // Crear
    const classroom = await ClassroomRepository.create(data);

    return classroom;
}
```

**Paso 4: Crear Repository** (Acceso a datos)

```javascript
// repositories/ClassroomRepository.js
async create(data) {
    const classroom = new Classroom(data);
    return await classroom.save();
}

async findById(id) {
    return await Classroom.findById(id);
}
```

**Paso 5: Crear Model** (Estructura)

```javascript
// models/Classroom.js
const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
```

**El flujo completo:**

```
POST /api/classrooms
    ↓
Route → Controller.createClassroom()
    ↓
Service.createClassroom(data)
    ↓
Repository.create(data)
    ↓
Model.save()
    ↓
Response 201 { classroom }
```

---

## 🧪 Testing por Capa

### Test Repository (Aislado, sin mock)

```javascript
import UserRepository from "../repositories/UserRepository";
import User from "../models/User";

describe("UserRepository", () => {
  test("create debe crear usuario", async () => {
    const user = await UserRepository.create({
      email: "test@example.com",
      password: "password123",
      // ...
    });

    expect(user.email).toBe("test@example.com");
    expect(user._id).toBeDefined();
  });
});
```

### Test Service (Con mock de Repository)

```javascript
import AuthService from "../services/AuthService";
import UserRepository from "../repositories/UserRepository";

jest.mock("../repositories/UserRepository");

describe("AuthService", () => {
  test("register debe validar email único", async () => {
    UserRepository.emailExists.mockResolvedValue(true);

    await expect(
      AuthService.register({
        email: "existing@example.com",
        // ...
      }),
    ).rejects.toThrow("Email ya registrado");
  });
});
```

### Test Controller (Con mock de Service)

```javascript
import AuthController from "../controllers/AuthController";
import AuthService from "../services/AuthService";

jest.mock("../services/AuthService");

describe("AuthController", () => {
  test("register debe retornar 201", async () => {
    AuthService.register.mockResolvedValue({
      user: { id: "1" },
      token: "token123",
    });

    const req = {
      body: {
        /* ... */
      },
    };
    const res = { status: jest.fn().json() };

    await AuthController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

---

## 🔄 Patrón Singleton para Servicios

Los servicios se exportan como **singleton** (instancia única):

```javascript
// services/AuthService.js

class AuthService {
  async register(data) {
    /* ... */
  }
}

export default new AuthService();
// Se crea UNA sola instancia
// Todos los controllers comparten la misma instancia
```

Ventajas:

- ✅ Una instancia para toda la aplicación
- ✅ Menor uso de memoria
- ✅ Fácil de inyectar dependencias

---

## 📝 Checklist para Nueva Funcionalidad

```
□ Crear Model en models/
□ Crear Repository en repositories/
  - findById()
  - create()
  - update()
  - delete()
  - Métodos específicos

□ Crear Service en services/
  - Validaciones
  - Reglas de negocio
  - Llamadas a repository

□ Crear Controller en controllers/
  - Extraer datos del request
  - Llamar servicio
  - Formatear respuesta

□ Crear Route en routes/
  - Mapear método HTTP
  - Asociar controller
  - Agregar middlewares (protect, authorize)

□ Registrar ruta en src/index.js
  - app.use('/api/...', router)

□ Escribir tests
```

---

## 🎓 Conceptos Clave

### Responsabilidad Única (SRP)

Cada clase tiene UNA responsabilidad:

- **Model**: Definir estructura
- **Repository**: Acceso a datos
- **Service**: Lógica de negocio
- **Controller**: HTTP
- **Route**: Mapeo

### Inyección de Dependencias

Los servicios usan repositories, no los crean:

```javascript
// ✅ CORRECTO
import UserRepository from "../repositories/UserRepository";

class AuthService {
  async register(data) {
    const user = await UserRepository.create(data);
    // UserRepository ya existe (singleton)
  }
}

// ❌ INCORRECTO
class AuthService {
  async register(data) {
    const repo = new UserRepository(); // NO hacer esto
  }
}
```

### Error Handling Centralizado

```javascript
// Servicio lanza AppError
throw new AppError("Email ya registrado", 400);

// asyncHandler lo captura
// errorHandler lo responde
```

---

## 🚦 Flujo de Validación

```
ENTRADA (request)
    ↓
CONTROLLER
  - Validación básica (campos presentes)
    ↓
SERVICE
  - Validaciones de negocio
  - Verificar unicidad
  - Verificar reglas
    ↓
REPOSITORY
  - Ejecutar operación BD
    ↓
MODEL
  - Validaciones de esquema
  - Ejecutar pre-hooks
    ↓
RESPONSE (201/200/error)
```

---

## 📊 Comparación: Antes vs Después

### ANTES (Sin capas)

```javascript
// controller
router.post('/register', async (req, res) => {
    // Validación
    if (!req.body.email) { /* ... */ }

    // Verificar unicidad
    const exists = await User.findOne({ email });
    if (exists) { /* error */ }

    // Crear
    const user = new User(req.body);
    await user.save();

    // Generar token
    const token = jwt.sign({ ... });

    // Responder
    res.status(201).json({ user, token });
});

// ❌ Problemas:
// - 30 líneas en controller
// - Lógica de negocio aquí
// - Difícil testear
// - No reutilizable
```

### DESPUÉS (Con capas)

```javascript
// controller
register = asyncHandler(async (req, res) => {
  const result = await AuthService.register(req.body);
  res.status(201).json({
    status: "success",
    data: result,
  });
});

// ✅ Ventajas:
// - 6 líneas claras
// - Responsabilidad única
// - Fácil testear
// - Reutilizable en múltiples routes
```

---

## 🔗 Dependencias entre Capas

```
ROUTES → CONTROLLERS
           ↓
        SERVICES → REPOSITORIES → MODELS
           ↑
          Utils (error, jwt)
```

**Regla de oro**: Las capas superiores nunca hablan directamente con las inferiores (excepto a través de servicios/repositories).

```javascript
// ❌ MALO
// En controller
const user = await User.findOne({ email }); // Acceso directo

// ✅ BUENO
// En controller
const user = await UserRepository.findByEmail(email);
```

---

## 📚 Patrones Usados

1. **Repository Pattern** - Abstrae acceso a datos
2. **Service Layer Pattern** - Encapsula lógica de negocio
3. **Singleton Pattern** - Instancia única de servicios
4. **Middleware Pattern** - Manejo de autenticación y errores
5. **Factory Pattern** - Controllers factory

---

## 🎯 Próximos Pasos

1. Reemplazar todos los controllers viejos
2. Agregar más servicios y repositories
3. Escribir tests para cada capa
4. Documentar nuevas funcionalidades
5. Mantener la arquitectura al agregar features

---

## ❓ Preguntas Frecuentes

**P: ¿Dónde va la lógica X?**

```
¿Es validación de negocio?          → SERVICE
¿Es operación CRUD?                 → REPOSITORY
¿Es manejo de HTTP?                 → CONTROLLER
¿Es respuesta al cliente?            → CONTROLLER
¿Es estructura de datos?             → MODEL
```

**P: ¿Puedo saltarme una capa?**

No. Mantén la consistencia. Si hoy saltas repository, mañana habrá inconsistencias.

**P: ¿Cuándo testear?**

Siempre. Test-Driven Development (TDD):

1. Escribe test
2. Escribe código
3. El test pasa

---

## 📖 Lectura Recomendada

- Clean Architecture - Robert C. Martin
- Patterns of Enterprise Application Architecture - Martin Fowler
- Design Patterns - Gang of Four
