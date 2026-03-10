# 006 - Groups, Enrollments & Assignments

## Objetivo

Documentar la operación académica diaria sobre grupos: creación de grupos, matrículas, traslados, estados de matrícula, asignación de docentes, relación grado-área y asignación de aula al estudiante.

## Alcance

- CRUD de grupos.
- Matrícula de estudiantes.
- Traslado entre grupos.
- Cambio manual de estado de matrícula.
- Consulta de estudiantes por grupo.
- Consulta de histórico de matrículas por estudiante.
- Asignación docente-grupo-área.
- Consulta de grupos por docente.
- Configuración de áreas por grado.
- Asignación de aula a estudiantes.

## Endpoints

- `GET /api/groups/school-year/:school_year_id`
- `POST /api/groups/enrollments`
- `POST /api/groups/enrollments/transfer`
- `PATCH /api/groups/enrollments/:id/status`
- `GET /api/groups/enrollments/student/:student_id`
- `POST /api/groups/teachers/assign`
- `GET /api/groups/teachers/:teacher_id/groups`
- `POST /api/groups/grade-areas`
- `GET /api/groups/grade-areas/:grade_id`
- `POST /api/groups`
- `GET /api/groups/:group_id/students`
- `GET /api/groups/:group_id/teachers`
- `GET /api/groups/:id`
- `PUT /api/groups/:id`
- `DELETE /api/groups/:id`
- `PATCH /api/students/:id/aula`

## Permisos

- Todas las rutas requieren autenticación.
- Crear/editar/eliminar grupos y operar matrículas requiere `admin`.
- Asignar docentes, áreas y aulas requiere `admin`.
- Consultas quedan disponibles para usuarios autenticados.

## Funcionalidades

### 1. Crear y administrar grupos

Request de creación:

```json
{
  "name": "6A",
  "grade_id": "65f0...",
  "school_year_id": "65f1...",
  "max_capacity": 35
}
```

Reglas:

- Deben existir el grado y el año escolar.
- La capacidad debe ser mayor a cero.
- No se puede eliminar un grupo con estudiantes activos.
- Al eliminar un grupo también se limpian asignaciones de docentes asociadas.

### 2. Matricular estudiante

`POST /api/groups/enrollments`

Request:

```json
{
  "student_id": "65f0...",
  "group_id": "65f1...",
  "school_year_id": "65f2..."
}
```

Reglas:

- El estudiante debe existir.
- El grupo debe existir.
- El grupo debe pertenecer al año escolar enviado.
- No puede existir otra matrícula activa del estudiante en ese mismo año.
- El grupo no puede exceder su `max_capacity`.
- Al crear la matrícula se actualiza `student.group_id`.

### 3. Trasladar matrícula

`POST /api/groups/enrollments/transfer`

Campos:

- `student_id`
- `school_year_id`
- `to_group_id`
- `reason`
- `observations`

Reglas:

- El estudiante debe tener matrícula activa en ese año.
- El grupo destino debe ser distinto al actual.
- El grupo destino debe pertenecer al mismo año escolar.
- El grupo destino debe tener cupo.
- La matrícula anterior se cierra como `transferred`.
- Se crea una nueva matrícula `active` enlazada por `previous_enrollment_id`.

### 4. Cambiar estado de matrícula

`PATCH /api/groups/enrollments/:id/status`

Estados válidos:

- `active`
- `transferred`
- `retired`

Efecto:

- Si se activa, el estudiante vuelve a apuntar al grupo de esa matrícula.
- Si se retira o transfiere, el sistema intenta recalcular el grupo activo del estudiante; si no existe, lo deja en `null`.

### 5. Consultas de grupo y matrículas

- `GET /api/groups/:group_id/students`: estudiantes con matrícula activa del grupo.
- `GET /api/groups/enrollments/student/:student_id`: histórico de matrículas del estudiante.
- `GET /api/groups/:group_id/teachers`: docentes asignados al grupo.
- `GET /api/groups/teachers/:teacher_id/groups`: grupos/asignaciones del docente.

### 6. Asignación de docente a grupo y área

`POST /api/groups/teachers/assign`

Request:

```json
{
  "teacher_id": "65f0...",
  "group_id": "65f1...",
  "area_id": "65f2..."
}
```

Reglas:

- Deben existir docente, grupo y área.
- El área debe estar previamente asignada al grado del grupo.
- No permite duplicar la misma combinación `teacher + group + area`.

### 7. Configuración área por grado

`POST /api/groups/grade-areas`

Request:

```json
{
  "grade_id": "65f0...",
  "area_id": "65f1...",
  "weekly_hours": 4
}
```

Reglas:

- El grado y el área deben existir.
- `weekly_hours` mínimo `1`.
- No se puede repetir la misma área dentro del mismo grado.

### 8. Asignación de aula

`PATCH /api/students/:id/aula`

Request:

```json
{
  "aula_id": "65f0..."
}
```

Reglas:

- El estudiante y el aula deben existir.
- Si cambia de aula, se verifica capacidad del aula destino.
- Si el aula ya alcanzó capacidad máxima, se rechaza la operación.

## Dependencias

- `GroupService`
- `StudentService`
- Repositorios de grupos, docentes, estudiantes, áreas, grados y matrículas.

## Riesgos y observaciones

- La capacidad de grupos y aulas es una regla dura de negocio.
- Las consultas no distinguen visibilidad por propietario; hoy dependen solo de autenticación.
- `PATCH /api/students/:id/aula` vive en módulo `students`, pero funcionalmente pertenece a la operación académica de asignación.
