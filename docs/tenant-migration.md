# Migración a aislamiento institucional

El backend ya soporta `institution_id` en las entidades tenant-owned, pero la protección de consultas se activa por configuración para permitir una migración controlada.

## Secuencia obligatoria

1. Crear la institución en sandbox y conservar su ObjectId.
2. Restaurar el backup en staging.
3. Ejecutar la migración en staging con `TENANT_DATA_ISOLATION=false`.
4. Comparar conteos y ejecutar la suite funcional del piloto.
5. Ejecutar `syncIndexes` mediante el script y revisar los índices eliminados/creados.
6. Activar `TENANT_DATA_ISOLATION=true` y `REQUIRE_INSTITUTION_CONTEXT=true` en staging.
7. Repetir pruebas de aislamiento con dos contextos institucionales.
8. Documentar la aprobación antes de aplicar el mismo procedimiento en producción.

## Ejecución

```bash
TENANT_MIGRATION_INSTITUTION_ID="<institution-object-id>" \
TENANT_MIGRATION_CONFIRM=EDUCONNECT-TENANT \
TENANT_DATA_ISOLATION=false \
yarn migrate:tenant
```

El script asigna únicamente documentos sin institución a la institución indicada y sincroniza índices de los modelos tenant-owned. No mueve documentos que ya pertenezcan a otra institución. La confirmación explícita evita ejecutar una migración por accidente.

Después de la verificación en staging:

```bash
TENANT_DATA_ISOLATION=true
REQUIRE_INSTITUTION_CONTEXT=true
```

Estos flags no deben activarse en producción antes de contar con el backup restaurable, la revisión de índices y las pruebas de aislamiento documentadas.
