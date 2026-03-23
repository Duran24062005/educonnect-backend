# 011 - Private File Storage on AWS S3

## Objetivo

Reemplazar el almacenamiento local de archivos en el backend por un almacenamiento privado en `AWS S3`, manteniendo los contratos HTTP actuales de subida y evitando que fotos de perfil o entregas de actividades dependan de `/uploads` o del filesystem efímero del runtime.

La meta de esta fase es cubrir tres necesidades concretas:

- persistir archivos de forma estable en entornos serverless o tradicionales
- mantener compatibilidad con el frontend actual que consume `profile_photo_url` y `file_url`
- controlar el acceso a archivos mediante URLs firmadas con expiración

## Problema detectado

Antes de este cambio, el backend escribía archivos en el filesystem local usando `multer.diskStorage()`.

Eso generaba varios problemas:

- los archivos dependían de `src/uploads` en desarrollo o de `/tmp` en entornos serverless
- el almacenamiento temporal no garantizaba persistencia real
- el backend exponía archivos mediante `/uploads`, lo que acoplaba acceso público con almacenamiento físico
- el sistema no tenía una capa de storage reusable ni extensible a otros proveedores

Consecuencia:

- riesgo de pérdida de archivos en despliegues serverless
- dificultad para escalar o mover la infraestructura
- contrato de acceso demasiado dependiente del runtime

## Alcance

Esta fase cubre:

- fotos de perfil de usuarios
- entregas de actividades por archivo
- persistencia de metadatos de storage en MongoDB
- generación de URLs firmadas expi­rables
- refresh automático de URLs firmadas cuando están vencidas o por vencer
- actualización de documentación, configuración y pruebas backend

## Repositorios impactados

Esta iniciativa impacta principalmente `educonnect-backend`.

- En `educonnect-backend` se documentan la capa de storage, los cambios de modelo, la integración con S3 y el contrato estable de respuesta.
- En `educonnect-portal` no se requiere rediseño de UX en esta fase; el portal sigue consumiendo `profile_photo_url` y `file_url`.

Este PRD vive en el backend porque la funcionalidad modifica persistencia, configuración de infraestructura y comportamiento de respuesta de la API.

## Fuera de alcance

Esta fase no incluye:

- migración automática de archivos históricos locales a S3
- fallback dual entre archivos locales y archivos en S3
- archivos públicos sin firma
- streaming proxy desde backend
- cambio de proveedor a Google Drive, R2, MinIO o compatibles S3
- panel administrativo de gestión de objetos

## Actores cubiertos

- `student`
- `teacher`
- `admin`

## Casos de uso principales

### 1. Subida de foto de perfil

Cuando un usuario autorizado actualiza su foto de perfil:

- el backend recibe el archivo vía `multipart/form-data`
- el archivo se mantiene en memoria, no en disco
- el backend lo sube a `AWS S3`
- se guarda en `Person` la metadata interna del objeto y la URL firmada actual
- si existía una foto previa en S3, se intenta borrar sin bloquear la operación principal

### 2. Entrega de actividad por archivo

Cuando un estudiante entrega una actividad con archivo:

- el backend recibe el archivo en memoria
- valida tamaño, extensión y reglas de la actividad
- sube el archivo a `AWS S3`
- guarda la metadata del objeto en `ActivitySubmission`
- si ya existía una entrega previa por archivo, intenta eliminar el objeto anterior

### 3. Lectura de URLs de archivo

Cuando un endpoint devuelve una entidad con `profile_photo_url` o `file_url`:

- si la URL firmada persistida sigue vigente, se reutiliza
- si está vencida o próxima a vencer, el backend genera una nueva
- la nueva firma se persiste en base de datos
- el contrato público sigue devolviendo `profile_photo_url` o `file_url`

## Contratos funcionales esperados

### Endpoints de subida que se mantienen

- `PATCH /api/users/:id/profile-photo`
- `POST /api/activities/student/me/:activity_id/submission`

No cambian:

- método HTTP
- tipo de payload (`multipart/form-data`)
- permisos funcionales ya existentes

### Contratos públicos que se mantienen

Las respuestas siguen exponiendo:

- `profile_photo_url`
- `file_url`

Regla explícita de esta fase:

- estas propiedades ya no representan rutas locales del backend
- ahora representan URLs firmadas temporales de S3

## Modelo de datos esperado

### Person

Se extiende `Person` con los siguientes campos:

- `storage_provider`
- `storage_bucket`
- `storage_key`
- `storage_signed_url`
- `storage_signed_url_expires_at`

`profile_photo_url` se mantiene como propiedad pública compatible y se sincroniza con `storage_signed_url`.

### ActivitySubmission

Se extiende `ActivitySubmission` con:

- `storage_provider`
- `storage_bucket`
- `storage_key`
- `storage_signed_url`
- `storage_signed_url_expires_at`

`file_url` se mantiene como propiedad pública compatible y se sincroniza con `storage_signed_url`.

## Backend

### Capa de storage

Se introduce una abstracción `StorageService` con operaciones explícitas para:

- subir foto de perfil
- subir entrega de actividad
- borrar objeto
- generar URL firmada
- validar si una firma está vencida o próxima a vencer

La implementación de esta fase usa `AWS S3` nativo.

### Estrategia de nombres de objeto

Las keys en S3 deben ser trazables y estables:

- `profiles/<userId>/<timestamp>-<safeOriginalName>`
- `activity-submissions/<activityId>/<studentId>/<timestamp>-<safeOriginalName>`

### Acceso a archivos

Los objetos del bucket deben permanecer privados.

El acceso se resuelve mediante URLs firmadas:

- con TTL configurable
- persistidas en MongoDB
- regeneradas cuando están vencidas o próximas a expirar

### Middlewares de upload

Los middlewares de carga deben migrar de `diskStorage` a `memoryStorage` para evitar dependencia del filesystem local.

Regla explícita:

- las validaciones actuales de tamaño, extensión y mime type deben mantenerse

### Endpoints de lectura impactados

Todo endpoint que devuelva usuarios, perfil autenticado, detalle de actividad o entregas debe ser capaz de refrescar la firma antes de responder si la actual ya no es segura de reutilizar.

## Configuración esperada

Variables de entorno mínimas:

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SIGNED_URL_TTL_SECONDS`

Defaults operativos de esta fase:

- TTL por defecto: `900` segundos
- margen de refresh anticipado: `60` segundos

## Criterios de aceptación

- subir foto de perfil crea objeto en S3 y actualiza `profile_photo_url`
- subir una nueva foto intenta eliminar el objeto anterior
- subir entrega de actividad crea objeto en S3 y actualiza `file_url`
- reentregar archivo intenta eliminar el objeto anterior
- entregas por link continúan sin usar S3
- endpoints de lectura refrescan URL firmada cuando está vencida o por vencer
- el frontend sigue funcionando sin cambiar formularios ni el uso de `getMediaUrl`
- el backend deja de exponer `express.static('/uploads')`
- tests de backend cubren upload, refresh de firma, reentrega y borrado

## Riesgos y observaciones

- persistir URLs firmadas implica que siempre existe una ventana de expiración y refresh
- los archivos históricos locales no quedan cubiertos automáticamente en esta fase
- si el borrado del objeto anterior falla, la operación principal no debe revertirse
- el bucket y las credenciales deben manejarse fuera del repo y con rotación adecuada

## Resultado esperado

La funcionalidad debe dejar al backend con un storage de archivos más seguro, portable y compatible con despliegues modernos:

- persistencia real de archivos
- desacople del filesystem local
- continuidad del contrato público de la API
- menor riesgo operativo en runtimes serverless
- base lista para evolucionar políticas de acceso o storage en fases posteriores
