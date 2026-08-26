# 035 - Migración del backend a monolito modular

## Problema y objetivo

El backend se ejecuta como un único servicio Express, pero su código está agrupado por capas globales (`routes`, `controllers`, `services` y `validators`). Esta estructura hace que una funcionalidad se distribuya por todo `src/` y que las dependencias entre dominios sean difíciles de reconocer.

El objetivo es organizar el backend como un monolito modular: un solo proceso, una sola aplicación y una sola base de datos, con módulos de negocio explícitos y una composición centralizada de la API.

## Alcance

- Crear módulos por dominio para autenticación, usuarios, estructura académica, grupos, estudiantes, acudientes, evaluaciones, analítica, actividades, notificaciones, asistencia, calendario, instituciones, auditoría e importaciones.
- Colocar en cada módulo sus rutas, controladores, servicios y validadores propios.
- Mantener modelos Mongoose y repositorios como infraestructura de persistencia compartida durante esta primera migración, porque varios dominios los consumen y no se debe duplicar la fuente de verdad.
- Centralizar el montaje de routers mediante un registro de módulos.
- Conservar las rutas HTTP, permisos, payloads, variables de entorno y puntos de entrada Node/Vercel.
- Actualizar la documentación para que la nueva estructura sea mantenible por otros colaboradores.

## Fuera de alcance

- Separar el backend en microservicios.
- Cambiar MongoDB, Mongoose, Express, JWT, almacenamiento o el contrato público de la API.
- Rediseñar reglas de negocio o migrar datos.
- Mover todavía los modelos y repositorios a módulos independientes; esa extracción requiere resolver sus dependencias cruzadas con más detalle.

## Arquitectura objetivo

```text
src/
  modules/
    <domain>/
      index.ts             # composición y contrato público del módulo
      <domain>.routes.ts
      <Domain>Controller.ts
      <Domain>Service.ts
      <domain>.validators.ts
    index.ts               # registro de módulos HTTP
  models/                  # persistencia Mongoose compartida
  repositories/            # consultas compartidas por varios dominios
  middlewares/             # preocupaciones transversales HTTP
  shared/                  # validación común, scope y servicios técnicos
  config/ tenant/ utils/ types/ docs/
```

Las dependencias entre dominios deben apuntar al servicio o contrato público del módulo consumidor, no a sus controladores ni a sus rutas. La composición HTTP queda limitada a `src/modules/index.ts` y `src/app.ts`.

## Mapa de módulos y actores

| Módulo | Responsabilidad principal | Actores |
| --- | --- | --- |
| `auth` | registro, login, perfil y sesiones | todos |
| `users` | administración, aprobaciones y estados | admin |
| `academic` | años, periodos, grados, áreas y aulas | admin |
| `groups` | grupos, asignaciones y enrolamientos | admin, teacher |
| `students` / `guardians` | perfiles, acudientes y vistas familiares | admin, student, parent |
| `evaluations` / `analytics` | calificaciones, resultados y dashboards | admin, teacher, student, parent |
| `activities` / `calendar` | actividades, entregas y agenda | teacher, student, admin |
| `attendance` | sesiones, registros y reportes | admin, teacher, student, parent |
| `notifications` | notificaciones y anuncios | todos |
| `institutions` | institución, sedes y jornadas | admin |
| `audit` / `imports` | trazabilidad e importación masiva | admin |

## Contratos, permisos y datos

- No cambian los prefijos ni los métodos HTTP publicados.
- Cada router conserva sus middlewares de autenticación, autorización, tenant y validación.
- No hay cambios de esquema ni de índices MongoDB.
- Los módulos pueden compartir repositorios y modelos mientras la persistencia siga siendo la fuente única de verdad.
- `shared` contiene únicamente capacidades transversales; no debe convertirse en un nuevo cajón para lógica de dominio.

## Validaciones y criterios de aceptación

- `yarn typecheck`, `yarn build` y la suite Jest del backend deben pasar.
- `app.ts` debe montar la API mediante el registro modular.
- El healthcheck, Swagger, entrada Node y entrada Vercel deben seguir funcionando.
- Las rutas y contratos existentes deben permanecer compatibles.
- La documentación de arquitectura debe explicar cómo agregar un módulo nuevo.

## Riesgos y siguientes pasos

- Los repositorios y modelos compartidos siguen representando acoplamiento técnico; su extracción a módulos de persistencia propios es una fase posterior.
- Algunas reglas cruzan dominios (por ejemplo, guardianes consume analítica y actividades consume notificaciones); dichas dependencias deben permanecer dirigidas a servicios, nunca a HTTP interno.
- En una siguiente fase se pueden agregar tests de arquitectura que impidan importar rutas/controladores de otro módulo.
