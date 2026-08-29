# Guía de Autenticación y Autorización (Actualizada)

## Modelo de autenticación

EduConnect usa JWT Bearer Token.

Header esperado:

```http
Authorization: Bearer <token>
```

Claims relevantes del token:

- `sub`: id de usuario.
- `role`: rol del usuario.
- `iat/exp`: emisión y expiración.

## Middlewares

- `protect`: exige token válido + perfil personal + estado activo.
- `protectIncomplete`: exige token válido, permite perfil no completado.
- `optionalAuth`: agrega contexto de usuario si token válido.
- `authorizeRoles(...roles)`: autorización por roles.

## Roles soportados

- `Admin`
- `SuperAdmin`
- `Teacher`
- `Student`
- `Parent`

Compatibilidad:

- Si existen datos antiguos con `Guardian`, se mapean a `Parent` a nivel de autorización/lógica.

## Flujo de registro

1. `POST /api/auth/register` crea credenciales y entrega token.
2. `POST /api/auth/complete-profile` completa datos personales.
3. Usuario queda en `pending` hasta aprobación administrativa.
4. Admin aprueba con `POST /api/users/:id/approve`.

## Recuperación de contraseña

El flujo público usa un código de 6 dígitos enviado por email:

1. `POST /api/auth/request-password-reset` recibe el correo y siempre responde con un mensaje genérico.
2. Si existe una cuenta, se crea un desafío con vigencia de 10 minutos y se envía el código mediante la plantilla `reset_password.html`.
3. `POST /api/auth/verify-password-reset-code` valida el código, con máximo 5 intentos, y entrega un `reset_token` temporal.
4. `POST /api/auth/reset-password` cambia la contraseña, consume el desafío y revoca las sesiones existentes.

Las cuentas no activas pueden actualizar su contraseña, pero el login continúa aplicando su estado de cuenta.

## SuperAdmin y bootstrap institucional

`SuperAdmin` es un rol global sin `institution_id`. No se puede solicitar desde el registro público y solo accede a las rutas `/api/platform/*`.

La cuenta inicial se crea con `yarn bootstrap:superadmin`, usando `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, `SUPERADMIN_FIRST_NAME`, `SUPERADMIN_LAST_NAME`, `SUPERADMIN_DOCUMENT_TYPE` y `SUPERADMIN_DOCUMENT_NUMBER`. El comando es idempotente por correo y exige una contraseña de al menos 12 caracteres.

El alta de una institución crea un `Admin` activo y le envía un código para definir su contraseña. El código no se devuelve por API y el reto anterior queda invalidado al reenviar una invitación.

## Buenas prácticas productivas

- Configurar `JWT_SECRET` robusto en producción.
- Definir `JWT_EXPIRE` acorde a política de seguridad.
- Restringir `CORS_ORIGIN` a dominios confiables.
- Nunca exponer secretos en repositorio.
