# PRD: User Registration & Roles

## Objetivo
Implementar un sistema de registro de usuarios con roles (Estudiante, Docente, Administrador, Padre/Acudiente), flujo de invitación y aprobación por parte de un administrador. Registrar acciones en `docs/` y mantener la documentación técnica actualizada.

## Requerimientos clave
- Roles: `student`, `teacher`, `admin`, `guardian`.
- Un usuario tiene un único rol, excepto `teacher` que puede tener `admin` además (flag `is_admin` o role link).
- Registro mediante invitación (código de invitación). Si no hay código, cuenta queda en estado `pending` y notifica a admins para asignar rol.
- Verificación de email requerida.
- Campos obligatorios: `first_name`, `last_name`, `birthdate`, `document_number`, `email`, `password`.
- Unicidad: `email` y `document_number`.
- Al registrarse, API retorna JWT automáticamente con claims `sub` and `role`.
- Auditoría mínima: registrar `created_by`, `created_at`.

## Flujo principal
1. Admin crea código de invitación o invita a un usuario (fuera de scope inicial: soporte por email).
2. Usuario visita endpoint `/auth/register` con código de invitación (opcional).
3. Si código válido → cuenta creada con rol preseleccionado (o `pending` si no se asigna rol).
4. Si código no provisto → cuenta creada con estado `pending` y se envía notificación a admins (stubbed).
5. Admin revisa cuentas `pending` y asigna rol vía endpoint `/users/{user_id}/approve`.
6. Al aprobar, el usuario recibe token JWT y puede usar la API.

## Endpoints (primarios)
- `POST /auth/register` — register user. Request: `RegisterUser` schema.
- `POST /auth/login` — login, retorna JWT.
- `GET /auth/verify-email?token=...` — verify email (stub/email token).
- `GET /users/pending` — (admin) listar cuentas pendientes.
- `POST /users/{id}/approve` — (admin) aprobar y asignar rol.

## Esquemas (resumen)
- `RegisterUser`:
  - `first_name`, `last_name`, `birthdate` (YYYY-MM-DD), `document_number`, `email`, `password`, `invitation_code` (opcional), `requested_role` (student|teacher|guardian)
- `UserResponse`: `id`, `email`, `role`, `first_name`, `last_name`, `birthdate`, `created_at`.

## Seguridad
- Passwords hashed con `passlib[bcrypt]`.
- JWT firmado con `HS256` y `SECRET_KEY` desde `ENV`.
- Rate limiting recomendado para endpoints de registro/login (documentado para futura implementación).

## DB & Migrations
- Usar PostgreSQL en producción; SQLAlchemy + Alembic.
- Tablas: `users`, `roles`, `invitations` (opcionales).

## Notas de despliegue
- Vercel requiere DB externa; configure una instancia PostgreSQL y ponga `DATABASE_URL` en Vercel env.

## Registro en docs
- Actualizar `docs/PRD_UserRegistration_Roles.md` con cualquier cambio de diseño o ruta.

