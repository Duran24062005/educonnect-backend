# API Docs (Resumen Operativo)

Este archivo resume los endpoints que hemos documentado hasta ahora.

## 1) Aprobar usuario

- Método: `POST`
- Endpoint: `/api/users/:id/approve`
- Requiere token de **admin**
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- `:id` debe ser el **ID del usuario** (`users._id`), no el de `person`.

Body:

```json
{
  "role": "student"
}
```

Valores válidos de `role` (actual): `student`, `teacher`, `admin`.

Validaciones:

1. `role` es obligatorio.
2. El usuario debe existir.
3. El usuario debe tener perfil personal (`person_id`).
4. El estado en `person.status` debe ser `pending`.

Respuesta exitosa:

- `200 OK` con mensaje `Usuario aprobado exitosamente`.

---

## 2) Cambiar estado de usuario

- Método: `PATCH`
- Endpoint: `/api/users/:id/status`
- Requiere token de **admin**
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- `:id` debe ser el **ID del usuario** (`users._id`).

Body:

```json
{
  "status": "inactive"
}
```

Valores válidos de `status` (actual): `active`, `pending`, `inactive`.

Validaciones:

1. `status` es obligatorio.
2. El usuario debe existir.
3. El usuario debe tener perfil personal (`person_id`).

Respuesta exitosa:

- `200 OK` con mensaje `Estado del usuario actualizado a <status>`.

---

## 3) Crear periodo

- Método: `POST`
- Endpoint: `/api/academic/periods`
- Requiere token de **admin**
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

Body:

```json
{
  "school_year_id": "65f0c1a2b3c4d5e6f7a8b9c0",
  "name": "Periodo 1",
  "weight": 0.25,
  "start_date": "2026-02-01",
  "end_date": "2026-04-30"
}
```

Validaciones:

1. `school_year_id`, `name`, `weight`, `start_date`, `end_date` son obligatorios.
2. `weight` debe estar entre `0` y `1`.
3. `start_date` debe ser menor que `end_date`.
4. La suma de pesos de periodos del mismo año escolar no puede superar `1.0`.

Respuesta exitosa:

- `201 Created` con el periodo creado.

---

## 4) Crear aula

- Método: `POST`
- Endpoint: `/api/academic/aulas`
- Requiere token de **admin**
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

Body:

```json
{
  "name": "Aula 101",
  "max_capacity": 35
}
```

Validaciones:

1. `name` es obligatorio.
2. `max_capacity` es obligatorio.
3. `max_capacity` debe ser mayor a `0`.

Respuesta exitosa:

- `201 Created` con el aula creada.

---

## 5) Crear grupo

- Método: `POST`
- Endpoint: `/api/groups`
- Requiere token de **admin**
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

Body:

```json
{
  "name": "6A",
  "grade_id": "ID_DEL_GRADO",
  "school_year_id": "ID_DEL_AÑO_ESCOLAR",
  "max_capacity": 35
}
```

Validaciones:

1. `name`, `grade_id`, `school_year_id`, `max_capacity` son obligatorios.
2. `max_capacity` debe ser mayor a `0`.
3. `grade_id` debe existir (si no, `404 Grado no encontrado`).
4. `school_year_id` debe existir (si no, `404 Año escolar no encontrado`).

Respuesta exitosa:

- `201 Created` con el grupo creado.
