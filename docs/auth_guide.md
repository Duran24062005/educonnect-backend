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

## Buenas prácticas productivas

- Configurar `JWT_SECRET` robusto en producción.
- Definir `JWT_EXPIRE` acorde a política de seguridad.
- Restringir `CORS_ORIGIN` a dominios confiables.
- Nunca exponer secretos en repositorio.

