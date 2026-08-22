# PRD 017 - Seguridad, sesiones y permisos

## Estado

- Estado: parcialmente implementado; permisos granulares y MFA pendientes.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 015 y PRD 016.

## Problema y objetivo

El rol tecnico `admin` concentra capacidades que en una institucion real pertenecen a secretaria, rectoria o coordinacion. El objetivo es proteger sesiones y recursos con permisos verificables por actor, institucion, sede, grupo y relacion familiar.

## Resultado de la planeacion

- Conservar `Session` como fuente de revocacion para tokens nuevos.
- Separar autenticacion, rol y alcance contextual; no resolver permisos con validaciones dispersas en controladores.
- Migrar gradualmente los tokens legacy antes de exigir `jti` en todos los accesos.
- No introducir MFA o refresh rotation sin definir recuperacion y soporte operativo.

## Alcance

- Sesiones revocables, expiracion y cierre de sesion.
- Rotacion segura de refresh tokens o cookies seguras.
- RBAC base y permisos contextuales por tenant, sede, grupo y asignacion.
- MFA para cuentas administrativas.
- Revision y revocacion administrativa de sesiones.
- Pruebas de IDOR, escalamiento de privilegios y aislamiento.

## Estado actual

### Implementado

- Los tokens nuevos incluyen `jti` y se respaldan en `Session`.
- Logout y cambio de password revocan sesiones.
- Admin puede consultar y revocar sesiones de otro usuario.
- Existe `accessScope` para restringir algunas operaciones por propiedad o asignacion.
- El tenant scope puede exigirse mediante configuracion.

### Pendiente

- Retirar la compatibilidad temporal con tokens legacy sin `jti`.
- Implementar refresh rotation o cookies seguras con deteccion de reutilizacion.
- MFA y recuperacion administrativa.
- Separar secretaria, rectoria, coordinacion y soporte del rol `admin`.
- Formalizar permisos por sede, grupo, asignacion y operacion de documentos.

## Actores

- Administrador de plataforma.
- Secretaria.
- Rector/coordinacion.
- Docente.
- Estudiante.
- Padre, madre o acudiente.
- Soporte con acceso excepcional y auditado.

## Contrato funcional esperado

### Endpoints y acciones

- `GET /api/users/:id/sessions` y `DELETE /api/users/:id/sessions/:jti` se mantienen para administracion.
- El futuro contrato de MFA debe cubrir enrolamiento, desafio, recuperacion y revocacion.
- Los endpoints de dominio deben resolver permisos mediante un servicio de alcance comun.

### Reglas

- Una sesion revocada no puede usar la API.
- Un usuario solo opera dentro de su institucion activa.
- Un docente solo modifica grupos y asignaciones autorizados.
- Un acudiente solo consulta estudiantes con vinculo autorizado.
- Los permisos denegados no deben revelar si existe un recurso de otro tenant.

## Impacto tecnico

- Revisar JWT, `Session`, middleware de autenticacion, `accessScope` y rutas de usuarios/dominio.
- Agregar indices y backfill solo si el diseño final de sesiones lo requiere.
- Cubrir cada permiso con pruebas API negativas, no solo con pruebas de rol positivo.

## Criterios de aceptacion

- Existe matriz de permisos aprobada por actor y contexto.
- MFA administrativo funciona con recuperacion probada.
- La rotacion invalida refresh tokens reutilizados.
- Las pruebas cross-tenant, IDOR y escalamiento pasan en staging.
- La separacion de roles no rompe el flujo del piloto ni requiere usar `admin` como comodin.

## Riesgos y preguntas abiertas

- Debe decidirse si el proveedor de identidad sera propio o externo.
- La granularidad por sede puede aumentar la complejidad de consultas y soporte.
- La politica de bloqueo, recuperacion y MFA debe ser aprobada por la institucion piloto.
