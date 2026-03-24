# 012 - Student Bulletin With Real Data

## Objetivo

Eliminar la generación mock del boletín del estudiante en frontend y entregar un documento académico armado con datos reales del backend para el estudiante autenticado.

## Problema

El módulo de boletín estudiantil mostraba una plantilla visual convincente, pero el contenido principal del documento se construía con datos sembrados en el cliente:

- estudiante ficticio
- institución ficticia
- observaciones ficticias
- áreas y evaluaciones simuladas

Esto generaba una inconsistencia grave entre la experiencia del estudiante y la información académica real registrada en el sistema.

## Alcance

- Crear un endpoint autenticado para que el estudiante consulte su boletín por año escolar y periodo.
- Armar la respuesta desde datos académicos reales.
- Conectar el portal al nuevo endpoint.
- Evitar que la UI rellene con mocks campos no integrados.

## Fuera de alcance

- Generación de PDF en backend.
- Firma digital institucional.
- Integración de asistencia real.
- Integración de convivencia o disciplina.
- Observaciones automáticas calculadas por IA o reglas.

## Endpoint

### Estudiante

`GET /api/analytics/student/me/bulletin?school_year_id=...&period_id=...`

## Reglas de acceso

- Requiere autenticación.
- Solo disponible para rol `student`.
- El `school_year_id` debe existir.
- El `period_id` debe pertenecer al año escolar consultado.
- El estudiante debe tener matrícula activa en ese año escolar.

## Datos que debe entregar

### Institución

- `official_name`
- `logo_url` opcional
- `municipality`
- `department`
- `dane_code` opcional
- `header_text` opcional
- `legal_note` opcional

Nota:

- La metadata institucional puede resolverse desde variables de entorno cuando no exista una entidad institucional dedicada en la base de datos.

### Estudiante

- nombre completo real
- tipo de documento
- número de documento
- código interno visible

### Matrícula

- grado
- grupo
- año lectivo

### Periodo

- identificador
- nombre
- fecha inicio
- fecha fin
- fecha de emisión

### Áreas

Por cada área presente en resultados o ítems del periodo:

- `area_id`
- `area_name`
- `period_average`
- `status`
- `final_result_label`
- evaluaciones del periodo con nombre, porcentaje y nota real del estudiante

## Fuente de datos

El boletín se debe construir desde:

- `Student`
- `User`
- `Person`
- `Enrollment`
- `Group`
- `Grade`
- `SchoolYear`
- `Period`
- `GradeItem`
- `StudentGrade`
- `PeriodAreaResult`

## Reglas de negocio

- El estudiante consultado siempre es el autenticado.
- La nota definitiva del área para el periodo prioriza `PeriodAreaResult.final_score`.
- Si todavía no existe consolidado para un área, se puede calcular el promedio ponderado usando `GradeItem.percentage` y `StudentGrade.score`.
- El estado del área usa umbral de aprobación `>= 6`.
- Las evaluaciones listadas deben corresponder únicamente al periodo consultado.

## Comportamiento en frontend

- El boletín debe seguir mostrando la plantilla institucional.
- Los campos que no estén integrados con datos reales no deben inventarse.
- En campos no disponibles se debe mostrar `N/D`, vacío controlado o texto explícito de no disponibilidad.
- La selección del periodo debe seguir dependiendo del año escolar activo y sus periodos.

## Riesgos

- Si existen notas cargadas pero no resultados consolidados, algunas áreas dependerán del cálculo al vuelo.
- Si faltan matrículas activas correctas, el endpoint debe responder con error claro.
- La plantilla actual del boletín tiene columnas históricas como `P1..P4`; mientras no exista una estructura anual completa en el contrato, solo se debe marcar el periodo consultado y no simular los demás.

## Criterios de aceptación

- Un estudiante autenticado puede abrir el boletín del periodo sin ver datos mock.
- El nombre, documento, grado y grupo corresponden al estudiante real.
- Las áreas del boletín salen de registros académicos reales.
- Las evaluaciones listadas corresponden a ítems reales del periodo.
- El frontend consume el nuevo endpoint y deja de generar el boletín en cliente.
- Los campos aún no integrados no muestran valores inventados.
