# PRD 016 - Multi-tenancy y estructura institucional

## Estado

- Estado: corte tecnico implementado; activacion en staging pendiente
- Repositorios: educonnect-backend y educonnect-portal
- Dependencia comercial: PRD 014

## Problema y objetivo

El piloto necesita separar los datos por institucion y representar la estructura minima con la que opera una matricula. La base tenant ya existe, pero sedes y jornadas no tenian un catalogo operativo ni referencias disponibles en el flujo administrativo.

El objetivo de este corte es permitir que un administrador configure sedes y jornadas dentro de su institucion y que una matricula pueda referenciarlas opcionalmente sin bloquear datos legacy que todavia no tienen esa informacion.

## Alcance implementado

- Entidad tenant-owned Campus con nombre, codigo, direccion y estado.
- Entidad tenant-owned SchoolShift con nombre, codigo, hora inicial, hora final y estado.
- CRUD administrativo por /api/institutions/current/campuses y /api/institutions/current/shifts.
- Desactivacion logica para conservar referencias historicas.
- Referencias opcionales campus_id y shift_id en Enrollment.
- Validacion de referencias activas en altas y traslados administrativos.
- Soporte de campus_code y shift_code en la importacion CSV de matriculas.
- Pantalla administrativa /institution/structure para crear, editar, activar y desactivar sedes y jornadas.

## Actores

- Admin: configura catalogos y los usa en matriculas.
- Secretaria/coordinacion representada temporalmente por admin: opera el mismo flujo durante el piloto.
- Estudiante, docente y acudiente: reciben la estructura como dato asociado a su matricula cuando el backend la expone; no administran catalogos.

## Datos y contratos

Los codigos se normalizan a mayusculas y son unicos dentro de la institucion. Las jornadas exigen formato HH:mm y hora inicial anterior a la final. El estado inactivo impide seleccionar la referencia para nuevas matriculas, pero no elimina historiales.

La importacion CSV usa los codigos de sede y jornada para resolver referencias en la misma institucion. Los archivos deben pasar por previsualizacion y confirmacion sin errores antes de escribir datos.

## Permisos y validaciones

- Las lecturas requieren usuario autenticado y contexto institucional.
- Las mutaciones requieren rol admin.
- El plugin tenant aplica el institution_id cuando TENANT_DATA_ISOLATION=true.
- El backend no acepta una sede o jornada inexistente o inactiva en una nueva matricula.
- La unicidad y los errores de horario se validan en modelo y servicio.

## Fuera de alcance

- Activar tenant isolation en produccion sin migracion y evidencia de staging.
- Expediente legal, consentimientos, custodia de documentos y retencion.
- Reglas de compatibilidad entre sede, jornada, grupo, aula y docente.
- Sincronizacion con SIMAT, SINEB, SIUCE u otra integracion oficial.

## Riesgos y siguientes pasos

- Los registros legacy pueden tener institution_id, sede o jornada nulos hasta ejecutar la migracion y completar el levantamiento institucional.
- La eliminacion logica evita perdida de historial, pero requiere una politica de catalogos antes de operar con datos reales.
- El siguiente gate es ejecutar migracion, backup/restauracion y pruebas cross-tenant en staging.
