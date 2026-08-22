# PRD 034 - Analitica de diferenciacion

## Estado

- Estado: planificado; existen dashboards base, pero no analitica de riesgo ni benchmarking comercial.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 023 y PRDs 025-031.

## Problema y objetivo

La analitica solo puede diferenciar el producto cuando los datos academicos, de asistencia y de documentos son confiables. El objetivo es agregar señales tempranas de riesgo y comparaciones utiles sin automatizar decisiones sensibles ni exponer datos entre instituciones.

## Alcance

- Indicadores de asistencia, notas incompletas, desempeño y continuidad.
- Alertas de riesgo explicables y revisables por personal autorizado.
- Tendencias por periodo, grado, grupo, sede y jornada.
- Benchmarking agregado y anonimizado, solo con consentimiento y volumen suficiente.
- Asistentes con revision humana, si se aprueban posteriormente.

## No implementado en el corte actual

- No hay modelo de riesgo, benchmarking entre instituciones ni asistente de decisiones.
- Los dashboards existentes son consultas agregadas y no deben interpretarse como prediccion.

## Actores

- Rector/coordinacion.
- Docente.
- Secretaria.
- Acudiente o estudiante, solo para su propia informacion autorizada.
- Responsable de datos y auditor.

## Contrato funcional esperado

- Cada indicador debe mostrar fuente, periodo, fecha de calculo y explicación.
- Una alerta no cambia notas, asistencia, matricula ni estado del estudiante automaticamente.
- El acceso respeta tenant, rol y minimizacion de datos.
- El usuario puede marcar seguimiento o descartar una señal con motivo.

## Impacto tecnico

- Requiere datos confiables de asistencia, evaluacion, matricula y documentos.
- Puede usar jobs y agregaciones del PRD 031, con indices por tenant.
- Debe auditar calculos, acceso y decisiones tomadas a partir de una alerta.

## Criterios de aceptacion

- Un indicador es reproducible con los mismos datos y periodo.
- Las alertas no mezclan instituciones ni revelan cohortes pequeñas.
- El personal puede revisar, corregir y documentar una señal.
- Las decisiones humanas quedan separadas de la salida analitica.
- El piloto mide utilidad sin prometer prediccion ni resultados garantizados.

## Riesgos y preguntas abiertas

- Riesgo de sesgo o estigmatizacion de estudiantes.
- Benchmarking requiere reglas de anonimización y umbral minimo.
- No usar IA generativa con datos de menores sin evaluacion legal, tecnica y de seguridad.
