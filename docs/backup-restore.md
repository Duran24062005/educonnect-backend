# Backup y restauración de MongoDB

Este flujo es un requisito operativo del gate P0 del PRD 014. Los backups contienen datos potencialmente sensibles y nunca deben entrar al repositorio.

## Requisitos

- MongoDB Database Tools (`mongodump` y `mongorestore`)
- `DATABASE_URL` o `MONGODB_URI` apuntando al ambiente objetivo
- Credenciales con permisos suficientes para leer o restaurar la base

## Crear un backup

```bash
DATABASE_URL="$DATABASE_URL" bash scripts/backup-mongodb.sh ./backups
```

El comando crea un directorio `backups/educonnect-<UTC>` con salida gzip. El directorio está excluido por `.gitignore` y debe almacenarse en un destino protegido con retención definida por la operación.

## Restaurar en un ambiente controlado

Primero restaura en una base aislada y valida conteos, usuarios de prueba, matrículas, calificaciones, auditoría y archivos referenciados antes de tocar producción:

```bash
DATABASE_URL="$STAGING_DATABASE_URL" \
  bash scripts/restore-mongodb.sh ./backups/educonnect-20260822T120000Z --drop
```

Sin `--drop`, los documentos existentes se conservan. `--drop` debe usarse únicamente en una base controlada o después de una aprobación operativa explícita.

## Evidencia del gate P0

Antes de habilitar datos reales se debe conservar:

1. Fecha, ambiente y responsable del backup.
2. Ruta o identificador del artefacto protegido.
3. Fecha, ambiente y responsable de la restauración.
4. Conteos comparados antes y después.
5. Resultado de una comprobación funcional del flujo importar, matricular, calificar, asistir, cerrar periodo, emitir boletín y consultar como acudiente.

Los scripts preparan el procedimiento, pero el gate no se considera aprobado hasta ejecutar y documentar una restauración real en un ambiente controlado.
