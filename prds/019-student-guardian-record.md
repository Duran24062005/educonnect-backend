# PRD 019 - Estudiantes, acudientes y expediente

## Estado

- Estado: parcialmente implementado; expediente legal y documentos pendientes.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 016, PRD 017 y PRD 018.

## Problema y objetivo

El portal familiar necesita saber no solo quien es un estudiante, sino que adulto esta autorizado, con que relacion, bajo que custodia y para que finalidades. El objetivo es consolidar un expediente minimo, trazable y restringido para estudiantes y acudientes.

## Resultado de la planeacion

- Mantener la relacion muchos-a-muchos: un acudiente puede tener varios estudiantes y un estudiante varios acudientes.
- Separar el vinculo academico de los documentos y consentimientos del expediente.
- Revocar acceso sin borrar el historico de la relacion.
- No habilitar datos reales de menores hasta cerrar custodia, consentimiento y retencion.

## Alcance

- Identidad y datos de contacto del estudiante y acudiente.
- Relacion, parentesco, autoridad y estado de autorizacion.
- Custodia, contactos de emergencia y restricciones de comunicacion.
- Expediente documental con permisos y retencion.
- Historial de cambios y consentimientos asociados.
- Portal familiar limitado a estudiantes autorizados.

## Estado actual

### Implementado

- `StudentGuardian` representa vinculos autorizados muchos-a-muchos.
- Se puede reemplazar la vinculacion administrativa de un estudiante.
- El portal lista todos los estudiantes autorizados de un acudiente.
- Las consultas vuelven a comprobar el vinculo por `guardian_id` y `student_id`.
- La importacion CSV puede vincular un acudiente con varios estudiantes.

### Pendiente

- Expediente formal del estudiante y acudiente.
- Custodia, autorizaciones diferenciadas y contactos de emergencia.
- Documentos base, versiones, retencion y revocacion.
- Consentimientos y responsables legales.
- Pantalla administrativa completa para revisar y aprobar vinculaciones.

## Actores

- Estudiante.
- Padre, madre o acudiente.
- Secretaria/coordinacion.
- Rector y responsable de proteccion de datos.
- Docente, solo para la informacion academica autorizada.

## Contrato funcional esperado

### Acciones existentes

- `GET /api/guardians/me/students`.
- `GET /api/guardians/me/dashboard`.
- `PATCH /api/students/:id/guardians`.

### Reglas futuras

- La vinculacion requiere identidad validada y estado explicito.
- Custodia o restriccion judicial puede limitar comunicacion y documentos.
- Un acudiente no puede consultar estudiantes por conocer su identificador.
- La desautorizacion corta el acceso nuevo y conserva evidencia del cambio.

## Impacto tecnico

- Extender `StudentGuardian` o separar entidades de vinculo, custodia y consentimiento segun el modelo legal aprobado.
- Integrar documentos con el almacenamiento privado del PRD 011/026.
- Auditar altas, cambios, aprobaciones y revocaciones.

## Criterios de aceptacion

- Se puede consultar el expediente de un estudiante con permisos diferenciados.
- Un acudiente con dos o mas estudiantes ve todos sus vinculos autorizados sin mezclar datos.
- Una revocacion impide consultas posteriores.
- La institucion puede demostrar quien aprobo el vinculo y bajo que consentimiento.
- Los documentos sensibles no aparecen en listados academicos generales.

## Riesgos y preguntas abiertas

- Custodia y autorizaciones requieren criterio legal e institucional.
- No se debe inferir parentesco o autoridad solo desde un CSV.
- Debe definirse que documentos son obligatorios por tipo de institucion.
