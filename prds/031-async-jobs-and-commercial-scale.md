# PRD 031 - Jobs asincronos y escala comercial

## Estado

- Estado: planificado; el corte actual ejecuta importaciones y reportes de forma sincrona.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 015 y PRDs 024-029.

## Problema y objetivo

Importaciones grandes, PDFs, reportes y notificaciones pueden superar los limites de una solicitud HTTP o de una funcion serverless. El objetivo es ejecutar trabajos largos con estado, reintentos, idempotencia y limites por institucion.

## Alcance

- Cola y worker compatibles con el despliegue elegido.
- `ImportJob`, `ReportJob`, `DocumentJob` y `NotificationJob` con estados.
- Reintentos, backoff, cancelacion y dead-letter.
- Progreso visible para el portal.
- Idempotencia por tenant y archivo/solicitud.
- Indices, limites y observabilidad.

## No implementado en el corte actual

- `ImportJob` registra cargas CSV, pero la confirmacion actual no es un worker durable.
- No existen colas, workers, reintentos ni procesamiento distribuido.
- Los reportes y documentos pendientes no tienen orquestacion asincrona.

## Actores

- Administrador que inicia un trabajo.
- Operacion que supervisa fallos.
- Usuario que consulta progreso o descarga el resultado.

## Contrato funcional esperado

- Crear un trabajo devuelve `job_id` y estado inicial.
- `GET /api/jobs/:id` devuelve estado, progreso, errores y artefactos autorizados.
- Reintentar el mismo trabajo no duplica matriculas, documentos ni notificaciones.
- Un usuario solo consulta jobs de su tenant y alcance.

## Impacto tecnico

- Requiere elegir proveedor de cola, persistencia de estado y estrategia serverless/worker.
- Debe integrarse con importaciones, PDFs, reportes y notificaciones.
- Requiere limites de concurrencia por tenant y métricas operativas.

## Criterios de aceptacion

- Un trabajo sobrevive al reinicio del proceso y puede reanudarse.
- Los fallos son visibles por fila o unidad procesada.
- Los reintentos son seguros e idempotentes.
- El portal puede consultar progreso sin mantener una solicitud abierta.
- Existen alertas para trabajos atascados y dead-letter.

## Riesgos y preguntas abiertas

- Vercel no debe asumirse como worker persistente.
- La eleccion de proveedor afecta costos, despliegue y residencia de datos.
- La migracion desde la importacion sincrona necesita compatibilidad temporal.
