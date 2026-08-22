# PRD 021 - Catalogo academico y asignaciones docentes

## Estado

- Estado: parcialmente implementado sobre el catalogo legado; falta separar asignatura, plan y carga formal.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 016 y PRD 020.

## Problema y objetivo

El modelo actual permite operar con grados, areas y asignaciones, pero no representa con suficiente precision una asignatura dentro de un plan curricular, su intensidad ni la carga de un docente. El objetivo es construir un catalogo estable que sea la fuente comun de notas, asistencia y calendario.

## Resultado de la planeacion

- Mantener compatibilidad con `Area` y asignaciones existentes durante la migracion.
- Separar area, asignatura, plan por grado/año y asignacion docente.
- Usar identificadores estables y contexto institucional para evitar duplicados.
- No modificar la escala de notas ni crear recuperaciones en este PRD; eso pertenece al PRD 022.

## Alcance

- Catalogo de areas y asignaturas.
- Plan curricular por año, grado y periodo.
- Intensidad horaria y orden de presentacion.
- Asignacion docente a grupo, asignatura y periodo.
- Relacion con aula, sede, jornada y calendario.
- Validacion de conflictos de carga y duplicados.

## Estado actual

### Implementado

- CRUD de grados, areas y aulas.
- Relacion area-grado con horas semanales.
- Asignacion docente-grupo-area.
- Consulta de grupos por docente.
- Calendario persistente con grupo, docente, aula y horario.

### Pendiente

- Entidad de asignatura diferenciada de area.
- Plan curricular versionado por año.
- Carga docente con periodo, intensidad y vigencia.
- Validacion de conflictos de docente, aula, grupo, sede y jornada.
- Migracion de asignaciones antiguas al catalogo formal.

## Actores

- Secretaria/coordinacion.
- Rector.
- Docente.
- Estudiante y acudiente como consumidores.

## Contrato funcional esperado

### Acciones existentes

- `POST /api/groups/grade-areas`.
- `POST /api/groups/teachers/assign`.
- `GET /api/groups/teachers/:teacher_id/groups`.

### Reglas futuras

- Una asignatura pertenece a un area o categoria institucional definida.
- Un grupo no puede tener dos asignaciones activas para la misma asignatura y periodo salvo co-docencia aprobada.
- Un docente no puede tener traslapes de horario incompatibles.
- Una asignacion inactiva conserva sus calificaciones y asistencia historicas.

## Impacto tecnico

- Incorporar modelos tenant-owned de asignatura, plan y asignacion.
- Diseñar backfill desde `Area` y `GroupTeacher` sin romper evaluaciones existentes.
- Exponer referencias consistentes a evaluaciones, asistencia y calendario.

## Criterios de aceptacion

- El plan curricular de un grado se puede consultar para un año concreto.
- El docente ve exactamente sus asignaciones vigentes.
- Notas, asistencia y calendario usan el mismo identificador academico.
- Los conflictos de carga se detectan antes de guardar.
- La migracion conserva historicos y permite rollback.

## Riesgos y preguntas abiertas

- La diferencia entre area y asignatura debe ser aprobada por la institucion piloto.
- Co-docencia, optativas y sedes compartidas pueden requerir reglas adicionales.
- La migracion desde `Area` no debe duplicar calificaciones ni asignaciones.
