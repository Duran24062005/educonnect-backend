# 🏗️ Arquitectura en Capas - EduConnect Backend

## Visión General

El proyecto está estructurado en **5 capas independientes**, cada una con una responsabilidad clara. Esto permite:

✅ **Separación de responsabilidades** - Cada capa tiene un único propósito  
✅ **Fácil testing** - Puedes testear cada capa por separado  
✅ **Mantenibilidad** - Cambios en una capa no afectan a otras  
✅ **Escalabilidad** - Fácil de extender sin romper código existente  
✅ **Reutilización** - La lógica se usa en múltiples controladores

---

## 🏢 Estructura de Capas

```
┌─────────────────────────────────────────────────────────┐
│         CAPA 1: ROUTES (Puntos de entrada)              │
│  Definen endpoints HTTP y mapean a controladores        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│         CAPA 2: CONTROLLERS (Presentación)              │
│  • Extraen datos del request                            │
│  • Llaman a servicios                                   │
│  • Formatean respuestas HTTP                            │
│  • NO contienen lógica de negocio                       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│         CAPA 3: SERVICES (Lógica de Negocio)            │
│  • Validaciones de datos                                │
│  • Reglas de negocio complejas                          │
│  • Coordinan múltiples repositorys                      │
│  • Lanzan errores personalizados                        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│      CAPA 4: REPOSITORIES (Acceso a Datos)              │
│  • Operaciones CRUD con base de datos                   │
│  • NO validan datos                                     │
│  • NO contienen lógica de negocio                       │
│  • Retornan documentos de BD                            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│         CAPA 5: MODELS (Estructura de Datos)            │
│  • Esquema Mongoose                                     │
│  • Validaciones a nivel de BD                           │
│  • Pre/post hooks                                       │
│  • Métodos de instancia (matchPassword, toJSON)         │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Directorios

```
src/
├── routes/                    # CAPA 1: Definición de endpoints
│   ├── auth/
│   │   └── auth.routes.js     # Rutas de autenticación
│   └── users.routes.js        # Rutas de usuarios
│
├── controllers/               # CAPA 2: Manejo de HTTP
│   ├── AuthController.js      # Lógica de requests de auth
│   └── UserController.js      # Lógica de requests de usuarios
│
├── services/                  # CAPA 3: Lógica de negocio
│   ├── AuthService.js         # Reglas de registro/login
│   └── UserService.js         # Reglas de gestión de usuarios
│
├── repositories/              # CAPA 4: Acceso a datos
│   └── UserRepository.js      # Operaciones CRUD de usuarios
│
├── models/                    # CAPA 5: Estructura de datos
│   └── User.js                # Esquema de Usuario
│
├── middleware/                # Middlewares auxiliares
│   └── auth.js                # Protección de rutas, roles
│
├── utils/                     # Utilidades compartidas
│   ├── error.js               # Manejo de errores
│   └── jwt.js                 # Funciones JWT
│
└── config/                    # Configuración
    └── config.js              # Variables y conexión
```

---

## 🔄 Flujo de una Petición HTTP

### Ejemplo: Registrar usuario

```
1. REQUEST LLEGA
   POST /api/auth/register
   { first_name, last_name, email, password... }

   ↓

2. ROUTING
   routes/auth/auth.routes.js
   Mapea POST /register → AuthController.register

   ↓

3. CONTROLLER (AuthController)
   ✓ Extrae datos de req.body
   ✓ Llama a AuthService.register(data)
   ✓ Recibe { user, token }
   ✓ Formatea response JSON
   ✓ Retorna res.status(201).json({...})

   ↓

4. SERVICE (AuthService)
   ✓ Valida campos (longitud, formato)
   ✓ Valida email único → Llama a repository
   ✓ Valida documento único → Llama a repository
   ✓ Valida rol válido
   ✓ Llama a UserRepository.create()
   ✓ Retorna { user, token }

   ↓

5. REPOSITORY (UserRepository)
   ✓ Recibe datos validados
   ✓ Crea instancia: new User(data)
   ✓ Guarda en BD: await user.save()
   ✓ Retorna documento creado

   ↓

6. MODEL (User)
   ✓ Ejecuta pre-hook: hashPassword
   ✓ Valida en BD (required, unique, etc)
   ✓ Guarda documento

   ↓

7. RESPONSE AL CLIENTE
   201 Created
   {
     "status": "success",
     "message": "Usuario registrado exitosamente",
     "data": {
       "user": { ... },
       "token": "eyJhbGc..."
     }
   }
```

---

## 💡 Responsabilidades por Capa

### 🔌 ROUTES (routes/)

```javascript
// SOLO definen endpoints y mapean a controladores
// NO contienen lógica de negocio

router.post("/register", AuthController.register);
//                      ↑ Controlador instanciado
```

### 🎮 CONTROLLERS (controllers/)

```javascript
// Manejo de HTTP - Extrae y responde

register = asyncHandler(async (req, res) => {
    // 1. Extraer del request
    const data = { first_name: req.body.first_name, ... };

    // 2. Llamar al servicio
    const result = await AuthService.register(data);

    // 3. Responder HTTP
    res.status(201).json({
        status: 'success',
        data: result
    });
});

// ✅ Responsabilidades:
// - Extraer parámetros (req.params, req.body, req.query)
// - Llamar servicios
// - Formatear respuestas HTTP
// - Manejar errores (delegados a middleware)

// ❌ NO debe hacer:
// - Validar datos complejos
// - Lógica de negocio
// - Acceso directo a BD
```

### 🧠 SERVICES (services/)

```javascript
// Lógica de negocio - Reglas y validaciones

async register(data) {
    // Validaciones de negocio
    if (!first_name) throw new AppError('...');
    if (password !== password_confirm) throw new AppError('...');

    // Verificar unicidad (usa repository)
    const exists = await UserRepository.emailExists(email);
    if (exists) throw new AppError('Email ya registrado', 400);

    // Crear usuario
    const user = await UserRepository.create(data);

    // Lógica post-creación
    const token = generateToken(user._id);

    return { user, token };
}

// ✅ Responsabilidades:
// - Validar datos del negocio
// - Aplicar reglas de negocio
// - Coordinar repositories
// - Lanzar AppError personalizados
// - Retornar datos estructurados

// ❌ NO debe hacer:
// - Manejar HTTP directamente
// - Acceso directo a modelos
```

### 📊 REPOSITORIES (repositories/)

```javascript
// Acceso a datos - CRUD puro

async create(userData) {
    const user = new User(userData);
    return await user.save();
}

async findByEmail(email) {
    return await User.findOne({ email });
}

async emailExists(email) {
    const user = await User.findOne({ email });
    return user !== null;
}

// ✅ Responsabilidades:
// - Operaciones CRUD (Create, Read, Update, Delete)
// - Consultas a base de datos
// - Retornar documentos/arrays

// ❌ NO debe hacer:
// - Validar datos
// - Lógica de negocio
// - Lanzar errores de negocio
// - Formatear respuestas
```

### 🗄️ MODELS (models/)

```javascript
// Estructura de datos - Schema

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "Email inválido"],
  },
});

userSchema.pre("save", async function () {
  this.password = await bcryptjs.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

// ✅ Responsabilidades:
// - Definir estructura (fields)
// - Validaciones básicas (required, type)
// - Pre/post hooks
// - Métodos de instancia

// ❌ NO debe hacer:
// - Lógica de negocio compleja
// - Coordinación de múltiples operaciones
```

---

## 🎯 Flujo de Errores

```
Error en cualquier capa
         ↓
    throw new AppError(mensaje, statusCode)
         ↓
asyncHandler captura en controller
         ↓
Pasa a middleware errorHandler
         ↓
Responde HTTP con error
```

Ejemplo:

```javascript
// En Service
if (emailExists) {
    throw new AppError('Email ya registrado', 400);
}

// asyncHandler lo captura
// errorHandler lo procesa
// Cliente recibe:
{
    "status": "fail",
    "message": "Email ya registrado"
}
```

---

## ✅ Best Practices Aplicadas

### 1️⃣ Separación de Responsabilidades

```
✓ Models = Schema y validaciones
✓ Repositories = CRUD
✓ Services = Reglas de negocio
✓ Controllers = HTTP
✓ Routes = Mapeo de endpoints
```

### 2️⃣ DRY (Don't Repeat Yourself)

```javascript
// ❌ MAL - Lógica duplicada
// AuthController
const emailExists = await User.findOne({ email });

// UserController
const emailExists = await User.findOne({ email });

// ✅ BIEN - Centralizado en repository
// UserRepository.emailExists(email)
```

### 3️⃣ Inversión de Control

```javascript
// Controllers NO crean servicios
// Services NO crean repositories

// Usan singletons inyectados
import AuthService from "../services/AuthService.js";
// Patrón singleton: export default new AuthService()
```

### 4️⃣ Manejo de Errores Centralizado

```javascript
// Cada capa lanza AppError
throw new AppError("Mensaje", statusCode);

// asyncHandler lo captura
// Middleware errorHandler lo responde
```

### 5️⃣ Validaciones en Capas

```
ROUTES:    Formato de entrada (tipos)
CONTROLLER: Presencia de campos requeridos
SERVICE:   Reglas de negocio (unicidad, relaciones)
MODEL:     Constraints de BD (type, required, unique)
```

---

## 🧪 Testing por Capa

```javascript
// Test de Repository - Aislado
const user = await UserRepository.create(userData);
expect(user.email).toBe(userData.email);

// Test de Service - Con mock de repository
jest.mock('../repositories/UserRepository');
UserRepository.emailExists.mockResolvedValue(false);
const result = await AuthService.register(data);
expect(result.user).toBeDefined();

// Test de Controller - Con mock de service
jest.mock('../services/AuthService');
AuthService.register.mockResolvedValue({...});
await AuthController.register(req, res);
expect(res.status).toHaveBeenCalledWith(201);
```

---

## 📈 Escalando el Proyecto

Para agregar una nueva funcionalidad (ej: Crear Aulas):

```
1. ROUTES
   routes/classroom.routes.js
   → POST /api/classrooms
   → GET /api/classrooms/:id

2. CONTROLLER
   controllers/ClassroomController.js
   → create()
   → getById()

3. SERVICE
   services/ClassroomService.js
   → validateAndCreateClassroom()
   → validateUserIsTeacher()

4. REPOSITORY
   repositories/ClassroomRepository.js
   → create()
   → findById()

5. MODEL
   models/Classroom.js
   → name, description, teacher_id, ...
```

Solo agrega código nuevo, sin modificar las otras capas.

---

## 🚀 Ventajas de Esta Arquitectura

| Característica       | Beneficio                                  |
| -------------------- | ------------------------------------------ |
| **Separación clara** | Fácil de entender y navegar                |
| **Testing**          | Cada capa testeable independientemente     |
| **Mantenimiento**    | Cambios localizados                        |
| **Reutilización**    | Servicios usados por múltiples controllers |
| **Escalabilidad**    | Agregar features sin romper código         |
| **Colaboración**     | Equipos pueden trabajar en capas distintas |
| **Performance**      | Optimizaciones específicas por capa        |

---

## 📚 Referencias

- **Single Responsibility Principle (SRP)**
- **Clean Architecture** by Robert C. Martin
- **Layered Architecture Pattern**
- **Repository Pattern**
- **Service Layer Pattern**
