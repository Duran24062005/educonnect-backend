# PRD 032 - Reportes e integraciones colombianas

## Estado

- Estado: planificado; no existen integraciones oficiales.
- Repositorio principal: `educonnect-backend`; consumo opcional en `educonnect-portal`.
- Dependencias: PRD 020, PRD 024 y PRD 028.

## Problema y objetivo

Una institucion puede necesitar exportar datos a formatos oficiales, pero EduConnect no debe presentarse como reemplazo de SIMAT, SINEB o SIUCE ni enviar información sin API, convenio o especificacion vigente. El objetivo es preparar exportaciones controladas y dejar las integraciones sujetas a contratos reales.

## Alcance

- Catalogo de formatos de exportacion por institucion.
- Validacion previa, errores por registro y artefacto descargable.
- Versionado de formatos y evidencia de quien exporto.
- Integraciones externas solo cuando exista API, convenio y responsable.
- Credenciales separadas, minimo privilegio y auditoria.

## No implementado en el corte actual

- No hay conectores con SIMAT, SINEB, SIUCE u otra entidad oficial.
- Los reportes CSV actuales son exportaciones internas y no implican compatibilidad oficial.

## Actores

- Secretaria que prepara la exportacion.
- Rector o responsable que la aprueba.
- Operacion que administra credenciales.
- Entidad externa, solo bajo contrato valido.

## Contrato funcional esperado

- Un exportador debe declarar version, origen, destino y fecha.
- Los registros invalidos se corrigen antes de enviar o descargar.
- Las credenciales nunca llegan al portal ni se guardan en respuestas.
- Cada envio o descarga genera auditoria.

## Impacto tecnico

- Formatos versionados, validadores y jobs del PRD 031.
- Integracion con auditoria, tenant scope y almacenamiento privado.
- Pruebas contractuales contra sandbox oficial cuando exista.

## Criterios de aceptacion

- Se puede generar un archivo interno validado sin afirmar que es oficial.
- Una integracion real solo se activa con contrato y credenciales de staging.
- Los errores muestran fila y causa sin exponer secretos.
- Se conserva evidencia de version, aprobacion y resultado.

## Riesgos y preguntas abiertas

- Los formatos y reglas externas cambian y deben tener fuente oficial.
- No iniciar scraping ni automatizacion de portales sin autorizacion.
- Debe definirse quien responde por la exactitud del envio institucional.
