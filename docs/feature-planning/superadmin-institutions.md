# SuperAdmin: onboarding de instituciones

## Problema y objetivo

EduConnect se desplegará como una plataforma multiinstitución. El equipo operador necesita crear clientes desde un espacio global, sin convertir ese operador en usuario de ningún colegio.

El flujo crea una institución y su primer administrador en una operación coordinada. El administrador recibe un código por correo para establecer su contraseña y luego continúa el onboarding desde el portal institucional.

## Actores y permisos

- `SuperAdmin`: operador global, sin `institution_id`; administra el catálogo de instituciones y sus estados.
- `Admin`: administrador de una institución; usa únicamente el portal de su tenant.
- En una institución pública, el primer `Admin` se referencia también como rector único mediante `Institution.rector_user_id`.

El rol `SuperAdmin` no se puede solicitar desde el registro público y no tiene acceso implícito a rutas `admin` institucionales.

## Contrato API

Todas las rutas requieren `Bearer JWT` y `SuperAdmin`.

### Crear

`POST /api/platform/institutions`

```json
{
  "institution": {
    "name": "Colegio Ejemplo",
    "code": "COLEGIO-EJEMPLO",
    "type": "public",
    "max_students": 800,
    "timezone": "America/Bogota"
  },
  "primary_admin": {
    "first_name": "Ana",
    "last_name": "Gómez",
    "email": "rectoria@colegio.edu.co",
    "document_type": "CC",
    "document_number": "123456789",
    "phone": "3000000000"
  }
}
```

La respuesta incluye la institución serializada y `invitation.sent`. Nunca incluye la contraseña temporal ni el código enviado.

### Consulta y operación

- `GET /api/platform/institutions`: listado paginado con `search`, `type` y `status`.
- `GET /api/platform/institutions/:id`: ficha con administrador principal y rector.
- `POST /api/platform/institutions/:id/primary-admin`: completa el onboarding de una institución legacy que aún no tiene administrador principal; no reemplaza uno existente.
- `PATCH /api/platform/institutions/:id`: edita nombre, código, límite y zona horaria. El tipo es inmutable.
- `PATCH /api/platform/institutions/:id/status`: acepta `active` o `suspended` y aplica las transiciones `sandbox → active`, `active → suspended` y `suspended → active`.
- `POST /api/platform/institutions/:id/primary-admin/invitation`: invalida el reto anterior y reenvía uno nuevo.

Las instituciones nuevas nacen en `sandbox`. Ese estado es comercial/onboarding: no bloquea el acceso del administrador institucional.

## Persistencia y aislamiento

La institución guarda `primary_admin_user_id` y, si es pública, `rector_user_id`. El usuario y la persona inicial se crean activos y con el mismo `institution_id`. La asignación posterior solo está disponible cuando `primary_admin_user_id` es nulo; en una pública también fija el rector si aún no existe.

La operación usa transacción MongoDB cuando el despliegue la soporta. En Mongo standalone utiliza compensación exacta de los identificadores creados si falla un paso. El correo se envía después de persistir; si falla, la institución permanece creada y se puede reenviar la invitación.

Las consultas globales están encapsuladas en `platform`. Los servicios institucionales continúan sujetos al contexto tenant. En producción se debe ejecutar con `TENANT_DATA_ISOLATION=true` y verificar previamente la migración de registros legacy.

## Bootstrap operativo

La primera cuenta global se crea fuera de HTTP:

```bash
SUPERADMIN_EMAIL=ops@educonnect.co \
SUPERADMIN_PASSWORD='una-clave-de-12-caracteres-o-mas' \
SUPERADMIN_FIRST_NAME='Equipo' \
SUPERADMIN_LAST_NAME='EduConnect' \
SUPERADMIN_DOCUMENT_TYPE=CC \
SUPERADMIN_DOCUMENT_NUMBER=1000000000 \
yarn bootstrap:superadmin
```

El comando es idempotente por correo, activa una cuenta `SuperAdmin` existente y rechaza reutilizar un correo de otro rol.

## Auditoría y riesgos

Se registran creación, edición, cambio de estado y reenvío de invitación con rol `superadmin`, institución afectada, IP y agente de usuario. No se registran contraseñas ni códigos.

No se incluye todavía facturación, cambio de administrador principal existente, reasignación de rector, ni creación de sedes: esas tareas quedan para el portal institucional.
