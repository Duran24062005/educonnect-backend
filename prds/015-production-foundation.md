# PRD 015 - Fundacion de produccion

## Estado

- Estado: parcialmente implementado; gate de staging pendiente.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencia: PRD 014.
- Este documento distingue la base operativa existente de los controles que aun deben probarse antes de usar datos reales.

## Problema y objetivo

El piloto no puede depender de procedimientos manuales ni considerar que un script equivale a una capacidad operativa aprobada. El objetivo es desplegar EduConnect con ambientes separados, configuracion controlada, backups restaurables, readiness, observabilidad y un procedimiento verificable de incidentes.

## Resultado de la planeacion

- Mantener el backend monolitico y documentar los controles operativos junto al repositorio que los ejecuta.
- Usar staging como requisito previo para migracion y datos reales.
- Tratar backup, restauracion y evidencia como controles independientes.
- No declarar el gate P0 aprobado por la sola existencia de scripts.

## Alcance

- Ambientes de desarrollo, staging y produccion con secretos separados.
- Readiness de API y healthcheck de contenedor.
- Backup y restauracion de MongoDB con retencion y responsables.
- Logs estructurados, errores correlacionables y alertas de disponibilidad.
- Runbook de despliegue, rollback, incidente y restauracion.
- Validaciones reproducibles de CI para backend y portal.

## Estado actual

### Implementado

- `GET /health/ready` comprueba la conexion con MongoDB.
- Docker usa readiness como healthcheck.
- Existen `scripts/backup-mongodb.sh` y `scripts/restore-mongodb.sh`.
- Los runbooks estan en `docs/backup-restore.md` y `docs/tenant-migration.md`.
- El backend tiene quality gates de typecheck, pruebas y build.

### Pendiente

- Ejecutar y registrar una restauracion real en staging.
- Definir retencion, destino protegido y cifrado de backups.
- Configurar observabilidad y alertas con un proveedor elegido.
- Completar rollback, respuesta a incidentes y responsables operativos.
- Retirar credenciales y datos compartidos entre ambientes.

## Actores

- `admin` o responsable de institucion: valida la operacion del piloto.
- Operacion/DevOps: despliega, respalda y restaura.
- Soporte: registra incidentes y evidencia.
- Equipo de desarrollo: mantiene healthchecks, logs y automatizacion.

## Contrato funcional esperado

### Endpoints y acciones

- `GET /health` para liveness.
- `GET /health/ready` para readiness.
- `yarn backup:mongodb` para generar el artefacto de backup.
- `yarn restore:mongodb` para restaurarlo en un ambiente controlado.

### Reglas

- Un backup no se considera valido hasta comprobar que puede restaurarse.
- La restauracion de produccion requiere aprobacion explicita y base aislada previa.
- Los secretos y backups no se almacenan en Git ni en logs.
- Cada despliegue debe poder asociarse a un commit y a un responsable.

## Impacto tecnico

- Revisar configuracion, scripts, Docker, CI y entrypoints serverless.
- Mantener evidencia de conteos y una prueba funcional despues de cada restauracion.
- No requiere una nueva entidad de dominio.

## Criterios de aceptacion

- Existe staging con secretos y MongoDB separados.
- Se ejecuta backup y restauracion completa con evidencia de resultado.
- Se validan conteos, autenticacion, matriculas, calificaciones, asistencia, boletin y portal familiar despues de restaurar.
- Existen alertas para API no disponible, readiness fallido y errores sostenidos.
- El procedimiento de rollback e incidente es ejecutable por otra persona del equipo.

## Riesgos y preguntas abiertas

- Falta seleccionar proveedor de observabilidad y destino de backups.
- El despliegue serverless puede limitar procesos persistentes de monitoreo.
- La politica de retencion debe ser aprobada junto con cumplimiento y proteccion de menores.
