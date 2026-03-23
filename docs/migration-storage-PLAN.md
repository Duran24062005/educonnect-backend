# Migración de Storage Local a AWS S3 con URLs Firmadas Persistidas

## Resumen
El backend de EduConnect deja de escribir archivos en `src/uploads` o en directorios temporales y pasa a usar `AWS S3` como almacenamiento privado para fotos de perfil y entregas de actividades.

Se mantiene el contrato de subida actual con `multipart/form-data`.
Las respuestas públicas siguen exponiendo `profile_photo_url` y `file_url`, pero ahora esas propiedades contienen URLs firmadas de S3.

## Implementación aplicada
- Se creó una capa `StorageService` con implementación `S3StorageService`.
- Los middlewares de upload migraron de `multer.diskStorage()` a `multer.memoryStorage()`.
- `Person` y `ActivitySubmission` ahora guardan:
  `storage_provider`, `storage_bucket`, `storage_key`, `storage_signed_url`, `storage_signed_url_expires_at`.
- `UserService`, `AuthService` y `ActivityService` regeneran la URL firmada cuando está vencida o por vencer.
- El backend ya no publica `express.static('/uploads')`.

## Contratos y decisiones
- Proveedor: `AWS S3`.
- Bucket: privado.
- Acceso: URL firmada expirable persistida en base de datos.
- TTL default: `900` segundos.
- Refresh anticipado: `60` segundos antes del vencimiento.
- Alcance: solo uploads nuevos; no se migran archivos locales históricos en esta fase.

## Variables de entorno
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SIGNED_URL_TTL_SECONDS`

## Criterios de aceptación implementados
- Subir foto de perfil crea objeto en S3 y reemplaza el anterior.
- Subir entrega de actividad crea objeto en S3 y en reentregas elimina el objeto previo.
- Entregas por link continúan sin usar storage externo.
- Lecturas posteriores refrescan la URL firmada si ya expiró o está cerca de expirar.
- El frontend sigue consumiendo `profile_photo_url` y `file_url` sin cambiar formularios ni UX.
