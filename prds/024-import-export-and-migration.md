# PRD 024 - Importación, exportación y migración

## Estado

- Estado: importación CSV controlada implementada para el piloto.
- Repositorios: `educonnect-backend` y `educonnect-portal`.

## Problema y objetivo

La carga inicial de una institución no puede depender de escritura manual ni guardar filas parcialmente validadas. Este corte entrega un flujo administrativo de previsualización, errores por fila, confirmación explícita y auditoría.

## Alcance implementado

- `POST /api/imports/preview` recibe un archivo CSV de máximo 2 MB y 5.000 filas.
- Se aceptan delimitadores coma y punto y coma, encabezados en español o inglés y campos entre comillas.
- Las entidades disponibles son estudiantes, acudientes, docentes, grados, áreas, grupos y matrículas.
- La previsualización no crea datos académicos. Guarda un `ImportJob` tenant-owned con filas normalizadas, resumen y errores.
- `POST /api/imports/:id/confirm` exige una previsualización sin errores antes de crear o actualizar datos.
- Los acudientes pueden aparecer en varias filas para vincularse con más de un estudiante.
- Las matrículas validan año, estudiante, grupo y cupo; un cambio de grupo registra el traslado anterior.
- Los eventos `import.previewed` e `import.confirmed` quedan en auditoría.
- El portal administrativo expone el selector de entidad, carga de archivo, tabla de errores y confirmación.

## Contratos y reglas

- Solo `admin` puede previsualizar, consultar y confirmar cargas.
- El archivo debe enviarse como `multipart/form-data` en el campo `file`, junto con `entity`.
- Las identidades requieren correo, nombres, documento, tipo de documento y contraseña inicial; la cuenta queda `pending` si no se informa otro estado.
- La confirmación se bloquea si existe cualquier error de validación.
- Los registros se actualizan por correo/documento o por sus referencias naturales, evitando duplicar relaciones de acudiente.

## Fuera de este corte

- Lectura directa de `.xlsx`.
- Jobs asíncronos, reintentos, exportaciones y migraciones entre instituciones.
- Integración con SIMAT, SINEB o SIUCE.
- Importación automática de asignaciones docentes y documentos académicos.

## Riesgos y operación

- El administrador debe revisar el resumen antes de confirmar y conservar el archivo de origen según la política de retención institucional.
- La carga no debe ejecutarse con datos reales hasta aprobar el gate P0, aislamiento tenant y backup restaurado.
- Los errores de persistencia dejan el job como `failed`; una nueva ejecución debe partir de una previsualización nueva.
