# 038 - Materiales educativos por sesión

## Objetivo

Permitir que un docente asocie varios recursos de aprendizaje a una sesión de clase y su tema. Los recursos pueden ser enlaces o archivos de cualquier tipo y deben estar disponibles para los estudiantes con matrícula activa en el grupo de la sesión.

## Resultado de la planeación

- Se crea un módulo `materials` independiente de actividades y calendario.
- `Material` referencia a `ClassSession`; no duplica el tema de la sesión.
- El docente puede crear una sesión desde el flujo de Materiales reutilizando el endpoint existente de calendario y después adjuntar el recurso.
- Los archivos se almacenan en storage privado y se sirven con URLs firmadas.
- “Editar” significa modificar metadatos, sesión/tema y reemplazar el archivo o enlace; no se edita el contenido interno de un documento.

## Alcance

- CRUD de materiales para docentes propietarios de la sesión.
- Consulta de materiales para estudiantes de la matrícula activa.
- Soporte para múltiples materiales por sesión.
- Archivos de cualquier MIME type hasta 50 MB por defecto, configurable por entorno.
- Enlaces `http` y `https`.
- Acceso contextual desde el detalle de una sesión del calendario.

## Fuera de alcance

- Edición colaborativa o modificación interna de PDF, DOCX u otros documentos.
- Notificaciones automáticas al publicar un material.
- Acceso adicional para acudientes o administradores en esta primera versión.

## Repositorios impactados

- `educonnect-backend`: modelo, storage, módulo HTTP, permisos, pruebas y Swagger.
- `educonnect-portal`: API cliente, navegación, vistas por rol, calendario y pruebas.

## Actores o roles impactados

- `teacher`: crea, consulta, actualiza y elimina materiales de sus sesiones.
- `student`: consulta materiales de su grupo y año escolar activo.

## Casos de uso principales

### 1. Publicar un recurso

El docente selecciona una sesión existente o crea una nueva desde Materiales, indica título y descripción y adjunta un archivo o enlace. El material queda visible inmediatamente para los estudiantes autorizados.

### 2. Editar un recurso

El docente puede actualizar título, descripción, sesión, tema y recurso. El tema se actualiza en `ClassSession` para mantener una única fuente de verdad.

### 3. Consultar un recurso

El estudiante consulta la sección Materiales o abre los recursos desde el detalle de una sesión del calendario. Las sesiones canceladas no revocan el acceso al material.

## Contrato funcional esperado

### Endpoints

- `GET /api/materials/teacher/me`
- `GET /api/materials/teacher/me/sessions`
- `POST /api/materials/teacher/me` (`multipart/form-data`)
- `PUT /api/materials/teacher/me/:material_id` (`multipart/form-data`)
- `DELETE /api/materials/teacher/me/:material_id`
- `GET /api/materials/student/me`
- `GET /api/materials/student/me/:material_id`

Los endpoints de creación y actualización aceptan un archivo en `material_file` o un `link_url`, nunca ambos. En actualización, omitir ambos conserva el recurso actual.

### Reglas funcionales

- Un material siempre pertenece a una sesión.
- La sesión debe pertenecer al docente para operaciones docentes.
- La sesión debe conservar una asignación válida de docente, grupo y materia.
- El estudiante debe tener matrícula activa en el grupo y año escolar de la sesión.
- Los enlaces solo aceptan `http` y `https`.
- El archivo no se filtra por extensión; se valida por tamaño y se conserva su MIME type.
- La eliminación de un material elimina también su objeto almacenado cuando existe.

## Impacto técnico

### Datos y persistencia

- Crear `MaterialModel` con tenant plugin e índices por sesión, docente y fecha.
- Crear repositorio y servicio de URLs firmadas para materiales.
- No requiere migración ni backfill.

### API y contratos

- El payload devuelve sesión, grupo, área, docente, tipo de recurso, metadatos y URL utilizable.
- El calendario no embebe materiales en cada sesión; el detalle consulta el endpoint filtrado por sesión para evitar cargar recursos innecesarios en la vista semanal.

### Validación y autorización

- `teacher` queda limitado por `teacher_id` de la sesión y por la asignación grupo + área.
- `student` queda limitado por su matrícula activa.
- Se rechaza archivo y enlace simultáneos, ausencia de ambos al crear, URL inválida y archivos mayores al límite.

## Configuración o infraestructura

- Reutilizar AWS S3 y credenciales existentes.
- Agregar `MATERIAL_FILE_SIZE_LIMIT_MB`, con valor por defecto `50`.
- Usar claves separadas bajo `session-materials/`.

## Documentación requerida

- Registrar este PRD en `prds/README.md`.
- Actualizar Swagger y `docs/api_docs.md`.
- Crear `educonnect-portal/docs/frontend/modules/materials.md`.
- Actualizar la documentación del calendario con el acceso contextual.

## Criterios de aceptación

- Docentes y estudiantes observan únicamente los recursos permitidos por su alcance.
- Se pueden publicar varios recursos en la misma sesión.
- Los archivos se abren mediante URLs firmadas y se pueden reemplazar sin referencias rotas.
- El tema editado desde Materiales se actualiza en la sesión del calendario.
- La suite existente y las validaciones de calidad siguen pasando.

## Riesgos y preguntas abiertas

- Storage y MongoDB no comparten transacción; se deben limpiar objetos huérfanos si falla la persistencia.
- Una creación desde Materiales se ejecuta en dos pasos: crear sesión y adjuntar material. Si el segundo paso falla, la sesión queda seleccionada para reintentar.
