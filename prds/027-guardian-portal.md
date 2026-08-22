# PRD 027 - Portal de acudiente

## Estado

Primera slice implementada: vínculo autorizado entre acudiente y estudiantes, consulta de estudiantes vinculados y dashboard familiar con datos académicos por estudiante. También se exponen asistencia, boletín básico, calendario familiar y comunicaciones administrativas/docentes dirigidas a acudientes.

## Objetivo

Permitir que una cuenta con rol `Parent` o `Guardian` consulte la información académica autorizada de todos los estudiantes vinculados, manteniendo el aislamiento entre instituciones y entre familias.

## Alcance implementado

- Modelo `StudentGuardian` para relaciones muchos-a-muchos entre `User` y `Student`.
- Estado `is_authorized` para revocar el acceso sin eliminar el vínculo histórico.
- `GET /api/guardians/me/students` para listar estudiantes autorizados.
- `GET /api/guardians/me/dashboard?school_year_id=...` para entregar el resumen académico de todos los estudiantes autorizados.
- `PATCH /api/students/:id/guardians` para que administración reemplace las vinculaciones del estudiante.
- `GET /api/guardians/me/attendance?school_year_id=...` para consultar asistencia agregada por estudiante vinculado.
- `GET /api/guardians/me/bulletin?school_year_id=...&period_id=...&student_id=...` para consultar el boletín básico de un estudiante vinculado.
- `GET /api/notifications/me` permite consultar anuncios administrativos y docentes recibidos por el acudiente.
- Dashboard familiar del portal con selector de año, tarjetas de todos los estudiantes y detalle académico del estudiante seleccionado.

## Contrato de lectura

El dashboard devuelve un elemento por estudiante:

```json
{
  "student": {
    "_id": "student-id",
    "full_name": "Nombre Apellido",
    "relationship": "mother",
    "group": { "_id": "group-id", "name": "6A", "grade_name": "6" }
  },
  "overview": {},
  "areas": [],
  "periods": []
}
```

El servidor calcula los datos usando el `student_id` vinculado. El cliente no puede convertir un ID arbitrario en acceso: cada consulta académica vuelve a comprobar la relación autorizada.

## Reglas de acceso

- Solo `parent`/`guardian` puede consumir las rutas familiares.
- Solo se devuelven vínculos con `is_authorized=true`.
- La comprobación de acceso se realiza por `guardian_id` y `student_id` dentro del tenant actual.
- Administración solo puede vincular usuarios cuyo rol sea `Parent` o `Guardian`.
- La relación puede tener varios acudientes y un acudiente puede tener varios estudiantes.

## Fuera de alcance de esta slice

- Expediente legal completo, custodia, consentimientos versionados y documentos del PRD 019.
- Boletines PDF oficiales y documentos verificables.
- Solicitudes de certificados, permisos o excusas.
- Aprobación institucional de excusas y notificaciones automáticas de asistencia.
- Gestión visual de vinculaciones en la pantalla administrativa; por ahora existe el endpoint administrativo y el flujo de importación/operación debe consumirlo.

## Riesgos y siguientes pasos

- El portal puede mostrar un estado vacío si el estudiante aún no fue vinculado por la institución.
- El gate comercial sigue bloqueado hasta validar tenant, consentimiento, retención y operación con datos sintéticos en staging.
- La relación debe integrarse al expediente del PRD 019 antes de habilitar datos reales de menores.
