# PRD 025 - Boletines oficiales

## Estado

- Estado: no iniciado; existe boletin basico de consulta, pero no documento oficial.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 018, PRD 022 y PRD 023.

## Problema y objetivo

El HTML actual permite consultar resultados academicos, pero no es un documento institucional emitido, versionado ni verificable. El objetivo es producir un boletin oficial inmutable por estudiante, año y periodo, con la politica SIEE aplicada y evidencia de quien lo emitio.

## Resultado de la planeacion

- Mantener el boletin basico como lectura no oficial durante la transicion.
- Generar un snapshot al emitir; futuras correcciones deben crear una nueva version.
- Reutilizar la politica SIEE configurada en el año lectivo.
- Separar emision oficial de consulta de datos en tiempo real.

## Alcance

- Plantilla institucional versionada.
- Snapshot de notas, asistencia, observaciones y escala aplicada.
- PDF privado y descarga autorizada.
- Consecutivo, emisor, fecha y estado de la emision.
- Firma o aprobacion institucional segun decision del colegio.
- Consulta y revocacion de versiones.

## Estado actual

### Implementado

- `GET /api/guardians/me/bulletin` entrega datos basicos por estudiante, año y periodo.
- El portal familiar muestra la consulta autorizada.
- La politica SIEE inicial se usa para interpretar resultados.

### Pendiente

- Render PDF, snapshot y version de plantilla.
- Consecutivo y sello/firma verificable.
- Almacenamiento privado y control de descarga.
- Flujo de aprobacion y reemision.
- Integracion con certificados del PRD 026.

## Actores

- Secretaria/coordinacion como emisor.
- Rector como aprobador cuando aplique.
- Estudiante y acudiente como lectores autorizados.
- Auditor como revisor de versiones.

## Contrato funcional esperado

- El endpoint actual de consulta no debe presentarse como emision oficial.
- El futuro recurso de boletin debe distinguir `draft`, `issued`, `superseded` y `revoked`.
- La descarga debe comprobar vinculo, tenant y estado del documento.

## Impacto tecnico

- Modelo de emision, version, snapshot y plantilla.
- Generacion PDF posiblemente asincrona, relacionada con PRD 031.
- Storage privado y URLs temporales del PRD 011/026.
- Auditoria de emision, aprobacion, descarga y revocacion.

## Criterios de aceptacion

- Un boletin emitido no cambia aunque cambien las notas posteriores.
- Una correccion genera version nueva y conserva la anterior.
- El PDF muestra escala, periodo, estudiante, institucion y emisor.
- Solo actores autorizados pueden descargarlo.
- La institucion puede verificar la autenticidad del documento.

## Riesgos y preguntas abiertas

- Firma, sello, consecutivo y requisitos formales deben ser definidos por la institucion.
- Un PDF no debe generarse en la solicitud si supera los limites del despliegue.
- Debe definirse el tratamiento de boletines reemitidos por errores administrativos.
