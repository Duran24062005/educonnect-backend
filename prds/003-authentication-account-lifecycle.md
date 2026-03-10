# 003 - Authentication & Account Lifecycle

## Objetivo

Documentar el flujo real de autenticación y ciclo de vida de cuenta en EduConnect: registro, completado de perfil, login, consulta de sesión, logout y cambio de contraseña.

## Alcance

- Registro inicial con email y contraseña.
- Completar perfil personal en un segundo paso.
- Login con JWT.
- Consulta del usuario autenticado.
- Consulta del estado de completitud del perfil.
- Logout a nivel de cliente.
- Cambio de contraseña para usuarios autenticados.

## Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/complete-profile`
- `GET /api/auth/profile-status`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`

## Flujos funcionales

### 1. Registro inicial

`POST /api/auth/register`

Request:

```json
{
  "email": "usuario@correo.com",
  "password": "secreta123",
  "password_confirm": "secreta123"
}
```

Respuesta esperada:

- Crea un `User` con `person_id = null`.
- Genera JWT inmediato.
- Marca `profile_complete: false`.

Reglas:

- El email se normaliza a minúsculas.
- Email debe ser válido.
- `password` y `password_confirm` deben coincidir.
- La contraseña debe tener al menos 8 caracteres.
- No permite emails duplicados.

### 2. Completar perfil

`POST /api/auth/complete-profile`

Requiere token de usuario con perfil incompleto.

Request:

```json
{
  "first_name": "Ana",
  "last_name": "Gomez",
  "born_date": "2012-05-14",
  "document_type": "RC",
  "document_number": "12345678",
  "phone": "3001234567",
  "requested_role": "Student"
}
```

Respuesta esperada:

- Crea registro `Person`.
- Vincula `Person.user_id` con `User`.
- Actualiza `User.person_id`.
- Si el rol es `Teacher` crea perfil docente.
- Si el rol es `Student` crea perfil de estudiante.
- Deja el estado del perfil en `pending`.
- Genera nuevo JWT con rol.

Reglas:

- `first_name`, `last_name`, `document_type` y `document_number` son obligatorios.
- `document_type` permitido: `CC`, `RC`, `CE`.
- `requested_role` permitido: `Student`, `Teacher`, `Parent`, `Guardian`.
- `Guardian` se normaliza internamente a `Parent`.
- No permite completar perfil dos veces.
- No permite documentos duplicados.

### 3. Login

`POST /api/auth/login`

Request:

```json
{
  "email": "usuario@correo.com",
  "password": "secreta123"
}
```

Respuesta esperada:

- Valida credenciales.
- Actualiza `last_login`.
- Devuelve `user`, `person`, `token` y `profile_complete`.

Reglas:

- Si el email no existe o la contraseña no coincide retorna `401`.
- Si el usuario tiene perfil y el `status` no es `active`, bloquea el acceso con `403`.
- Un usuario registrado pero sin perfil completo sí puede autenticarse para terminar el onboarding.

### 4. Estado del perfil

`GET /api/auth/profile-status`

Uso:

- Permite al frontend decidir si debe mostrar la pantalla de completar perfil.

Respuesta:

```json
{
  "status": "success",
  "data": {
    "profile_complete": true,
    "person_status": "pending"
  }
}
```

### 5. Usuario actual

`GET /api/auth/me`

Uso:

- Obtiene datos de sesión activos, incluyendo `user`, `person` y bandera `profile_complete`.

### 6. Logout

`POST /api/auth/logout`

Uso real:

- No invalida tokens en servidor.
- Devuelve un mensaje para que el cliente elimine el JWT localmente.

### 7. Cambio de contraseña

`POST /api/auth/change-password`

Request:

```json
{
  "current_password": "anterior123",
  "new_password": "nuevaClave123",
  "new_password_confirm": "nuevaClave123"
}
```

Reglas:

- Todos los campos son obligatorios.
- La nueva contraseña debe tener al menos 8 caracteres.
- `new_password` y `new_password_confirm` deben coincidir.
- La contraseña actual debe ser válida.

Respuesta:

```json
{
  "status": "success",
  "message": "Contraseña actualizada exitosamente"
}
```

## Seguridad y autorización

- Autenticación basada en JWT.
- `protect` exige token válido.
- `protectIncomplete` permite operar a usuarios con perfil incompleto para terminar onboarding.
- `login` exige que cuentas ya aprobadas estén en estado `active`.

## Dependencias

- `UserRepository`
- `PersonRepository`
- `teacherRepository`
- `studentRepository`
- `EmailService`
- `auth.middleware`

## Limitaciones actuales

- No existe flujo de recuperación de contraseña.
- No existe invalidación server-side de JWT en logout.
- No hay refresh tokens.
- No hay rate limiting específico para login/registro.

## Notas de despliegue

- Requiere `JWT_SECRET` y expiración configurada.
- Si el servicio de email falla, el flujo de negocio principal ya creó la cuenta/perfil.
