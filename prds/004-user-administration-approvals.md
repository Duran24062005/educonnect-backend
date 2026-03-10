# 004 - User Administration & Approvals

## Objetivo

Documentar la administración operativa de usuarios: listados, filtros, consulta individual, actualización de perfil, foto, aprobación, rechazo, cambio de estado y estadísticas.

## Alcance

- Gestión administrativa de usuarios.
- Aprobación del onboarding.
- Rechazo y eliminación.
- Cambio manual de estados.
- Actualización de datos personales.
- Carga de foto de perfil.

## Endpoints

- `GET /api/users`
- `GET /api/users/role/:role`
- `GET /api/users/admin/pending`
- `GET /api/users/admin/stats`
- `POST /api/users/:id/approve`
- `DELETE /api/users/:id`
- `PATCH /api/users/:id/status`
- `PATCH /api/users/:id/profile-photo`
- `GET /api/users/:id`
- `PUT /api/users/:id`

## Roles y permisos

- Todas las rutas requieren autenticación.
- Las operaciones administrativas requieren rol `admin`.
- Un usuario normal solo puede actualizar su propio perfil y su propia foto.
- Un admin puede actualizar o cargar foto para cualquier usuario.

## Funcionalidades

### 1. Listado general de usuarios

`GET /api/users`

Filtros soportados:

- `role`: `student`, `teacher`, `admin`, `parent`, `guardian`
- `status`: `active`, `pending`, `inactive`, `blocked`, `egresado`
- `search`
- `page`
- `limit`

Respuesta:

- Devuelve `users` y bloque `pagination`.

### 2. Listado por rol

`GET /api/users/role/:role`

Uso:

- Variante especializada del listado general con paginación.

### 3. Usuarios pendientes de aprobación

`GET /api/users/admin/pending`

Uso:

- Lista cuentas cuyo `person.status` está en `pending`.
- Permite alimentar una cola de aprobación manual.

### 4. Aprobar usuario

`POST /api/users/:id/approve`

Request:

```json
{
  "role": "student"
}
```

Reglas:

- Solo acepta roles `student`, `teacher`, `admin`, `parent`, `guardian`.
- El usuario debe existir.
- El usuario debe tener perfil personal creado.
- El estado actual debe ser `pending`.
- `guardian` se persiste como rol `Parent`.
- Al aprobar, el estado pasa a `active`.

### 5. Rechazar usuario

`DELETE /api/users/:id`

Uso:

- Elimina el usuario cuando la cuenta no debe continuar en el sistema.

Nota:

- El comportamiento real es eliminación, no un cambio de estado lógico.

### 6. Cambiar estado manualmente

`PATCH /api/users/:id/status`

Request:

```json
{
  "status": "blocked"
}
```

Estados válidos:

- `active`
- `pending`
- `inactive`
- `blocked`
- `egresado`

### 7. Consultar usuario por ID

`GET /api/users/:id`

Uso:

- Retorna la representación completa del usuario con su perfil relacionado.

### 8. Actualizar perfil personal

`PUT /api/users/:id`

Campos soportados:

- `first_name`
- `last_name`
- `birthdate`
- `born_date`
- `document_number`

Reglas:

- Solo el mismo usuario o un admin pueden actualizar.
- El usuario objetivo debe existir.
- Debe tener perfil personal creado.
- El documento debe seguir siendo único.
- `birthdate` y `born_date` se normalizan al campo interno `born_date`.

### 9. Foto de perfil

`PATCH /api/users/:id/profile-photo`

Uso:

- Carga `multipart/form-data` con la llave `profile_photo`.
- Reemplaza la foto anterior si existía en `/uploads/profiles`.

Resultado:

- Devuelve `profile_photo_url` y `person_id`.

### 10. Estadísticas administrativas

`GET /api/users/admin/stats`

Uso:

- Expone agregados para dashboards administrativos de usuarios.

## Reglas de negocio

- El onboarding queda realmente cerrado cuando un admin aprueba la cuenta.
- Los estados de usuario viven en `Person.status`, no en `User`.
- El rol operativo también se apoya en `Person.role`.
- `egresado` se usa como estado final para estudiantes graduados.

## Dependencias

- `UserService`
- `UserRepository`
- `PersonRepository`
- `upload.middleware`

## Riesgos y observaciones

- `DELETE /api/users/:id` es destructivo y no reversible.
- No existe auditoría formal expuesta por endpoint, aunque sí se guarda `updated_by` en algunos cambios.
- La foto de perfil depende de almacenamiento local del backend.
