# 036 - Recuperación de contraseña por código

## Objetivo

Permitir que una persona que olvidó su contraseña recupere el acceso desde el login mediante un código enviado a su correo.

## Resultado de la planeación

- Se eligió un código numérico de 6 dígitos con vigencia de 10 minutos.
- El código se almacena únicamente como hash, permite 5 intentos y es de un solo uso.
- La respuesta de solicitud es genérica para no revelar si un correo está registrado.
- Después de validar el código, el usuario define una nueva contraseña y vuelve al login.
- El cambio de contraseña revoca las sesiones existentes.

## Alcance

- Endpoints públicos de solicitud, validación y cambio de contraseña.
- Persistencia de desafíos de recuperación en MongoDB.
- Envío del código mediante la plantilla externa `password_reset`.
- Pantalla pública del portal con correo, código y nueva contraseña.

## Fuera de alcance

- Inicio de sesión automático después del cambio.
- Recuperación por enlace.
- Cambio de reglas de activación, aprobación o bloqueo de cuentas.

## Repositorios impactados

- `educonnect-backend`: modelo, repositorio, servicio, endpoints, rate limiting y documentación del contrato.
- `educonnect-portal`: ruta pública, cliente HTTP, pantalla y pruebas de interacción.

## Actores o roles impactados

- Cualquier usuario con una cuenta registrada.
- Las cuentas pendientes, inactivas o bloqueadas pueden cambiar la clave, pero mantienen las restricciones de acceso existentes.

## Contrato funcional esperado

### Endpoints

- `POST /api/auth/request-password-reset` recibe `{ email }` y responde `202` con un mensaje genérico.
- `POST /api/auth/verify-password-reset-code` recibe `{ email, code }` y devuelve un `reset_token` temporal.
- `POST /api/auth/reset-password` recibe `{ reset_token, new_password, new_password_confirm }`.

### Reglas

- El código debe tener exactamente 6 dígitos.
- Solo existe un desafío activo por usuario; solicitar otro invalida el anterior.
- El sexto intento de validación se rechaza.
- Los códigos expirados, invalidados o usados no pueden reutilizarse.
- La contraseña nueva debe tener mínimo 8 caracteres y coincidir con su confirmación.

## Impacto técnico

### Datos y persistencia

Se agrega `PasswordResetRequest` con `user_id`, `code_hash`, `expires_at`, contador de intentos y marcas de verificación, uso e invalidación. El índice TTL de `expires_at` elimina los desafíos vencidos.

### API e integraciones

La plantilla `password_reset` del proveedor de email debe renderizar `template_data.codigo`. La plantilla fuente está en `templates/password_reset.html` y usa los placeholders `{{nombre}}`, `{{codigo}}` y `{{empresa}}`. El backend no envía el código en la respuesta HTTP.

### Seguridad

- Rate limiting de 5 solicitudes por 15 minutos y 10 validaciones por 15 minutos por IP.
- Mensaje genérico para correos existentes y no existentes.
- El token temporal posterior a la validación dura 10 minutos y se vincula al desafío validado.
- El token no sustituye al JWT de sesión ni pasa por `protect`.

## Criterios de aceptación

- Un usuario recibe un código, lo valida, define una nueva contraseña y puede iniciar sesión con ella.
- Un código inválido, expirado, agotado o reutilizado no permite cambiar la contraseña.
- Las sesiones anteriores quedan revocadas después del cambio.
- Las cuentas bloqueadas no obtienen acceso por el hecho de recuperar la contraseña.
- El portal permite completar el flujo sin guardar correo, código ni token en `localStorage`.

## Riesgos y operación

- El proveedor de correo debe tener actualizada la plantilla `password_reset`; si no renderiza `codigo`, el usuario no podrá completar el flujo aunque la solicitud se cree correctamente.
- Los índices nuevos deben crearse al iniciar la aplicación o mediante el proceso habitual de sincronización de índices de MongoDB.
