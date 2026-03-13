# 009 - Performance & Loading Optimization

## Objetivo

Reducir el tiempo de carga inicial y la cantidad de requests necesarias para renderizar dashboards y pantallas pesadas del portal, sin cambiar permisos, reglas de negocio ni contratos funcionales existentes.

## Problema detectado

Antes de esta optimización, el sistema presentaba tres problemas combinados:

- El frontend cargaba demasiadas pantallas privadas en el bundle inicial.
- Varias vistas pesadas armaban su UI a partir de múltiples requests independientes.
- Existía poco cache compartido entre navegación, filtros y regreso entre rutas.

Consecuencia:

- percepción de lentitud al entrar al panel
- cascadas de requests en dashboards y detalle de grupos
- refetch innecesario al cambiar filtros o volver a una vista ya visitada

## Alcance

- carga inicial del portal web
- dashboards de admin y teacher
- vista de detalle de grupo
- reutilización de datos compartidos de sesión y contexto académico

## Repositorios impactados

Esta iniciativa cruza producto, pero no convierte a `educonnect-backend` y `educonnect-portal` en un mismo repositorio.

- En `educonnect-backend` se documentan los endpoints agregados, la cache de lectura y las decisiones de API.
- En `educonnect-portal` se documentan lazy loading, React Query, chunks, placeholders y consumo de esos endpoints.

Este PRD vive en el backend porque una parte del alcance introduce contratos HTTP nuevos. La documentacion de consumo del portal debe mantenerse en el repo del portal.

## Fuera de alcance

- optimización mobile nativa
- cambio de proveedor de almacenamiento
- reescritura completa de todos los módulos a React Query
- eliminación de endpoints legados

## Estrategia

La optimización se implementa en tres frentes:

### 1. Carga diferida del frontend

- Las pantallas privadas más pesadas pasan a `lazy loading`.
- `App.tsx` usa `lazy()` + `Suspense` para cargar bajo demanda:
  - dashboard
  - estadísticas
  - detalle de grupo
  - módulos teacher pesados
  - actividades y resultados de estudiante

Objetivo:

- evitar que toda la aplicación privada entre en el bundle inicial
- mover el costo a navegación real por ruta

### 2. Cache compartido en frontend

Se estandariza React Query para datos de alto reuso:

- `useSchoolYears`
- `useAdminDashboardSummary`
- `useTeacherDashboardSummary`
- `useGroupDetailSummary`

Reglas:

- los años escolares no deben volver a pedirse manualmente por cada pantalla
- dashboards deben consumir resúmenes agregados y cacheados
- pantallas con cambio de filtro deben usar `placeholderData` para no vaciar la UI durante el refetch

### 3. Endpoints agregados orientados a UI

Se agregan respuestas resumidas para reducir waterfalls:

- `GET /api/analytics/admin/dashboard-summary?school_year_id=...`
- `GET /api/analytics/teacher/me/dashboard-summary?school_year_id=...`
- `GET /api/groups/:group_id/detail-summary`

Estos endpoints:

- no reemplazan a los existentes
- se introducen para vistas pesadas del portal
- entregan payload listo para renderizar sin reconstruir la pantalla desde 4 a 8 requests separadas

## Backend

### Analytics admin summary

`GET /api/analytics/admin/dashboard-summary`

Entrega en una sola respuesta:

- stats de usuarios
- pendientes
- overview institucional
- tendencia institucional
- agregados por grado
- agregados por área

### Analytics teacher summary

`GET /api/analytics/teacher/me/dashboard-summary`

Entrega:

- conteo de asignaciones
- conteo de grupos
- conteo de estudiantes
- promedio general docente
- lista de grupos/asignaciones ya enriquecida con:
  - promedio
  - aprobados y reprobados
  - tendencia por periodo
  - estudiantes del grupo con promedio y estado

### Group detail summary

`GET /api/groups/:group_id/detail-summary`

Entrega:

- grupo con métricas de capacidad
- estudiantes activos del grupo
- docentes asignados
- áreas configuradas para el grado
- catálogo de áreas
- opciones de docentes para asignación

### Cache en memoria

Se introduce `simpleMemoryCache` para respuestas agregadas de lectura:

- TTL corto
- enfocado en reducir recomputación de dashboards
- sin persistencia entre reinicios

Esta cache es una optimización de lectura, no una fuente de verdad.

Responsabilidad explicita del backend en esta fase:

- agregar endpoints listos para UI sin romper los legados
- reducir recomputacion de agregados frecuentes
- mantener permisos y reglas de negocio intactos
- exponer contratos estables para que el portal pueda optimizar su carga

## Frontend

### Pantallas impactadas

- `DashboardPage`
- `MyGroupsPage`
- `GroupDetailPage`
- `EvaluationStatsPage`

### Comportamiento esperado

- dashboard admin usa un único resumen agregado para métricas institucionales
- dashboard teacher deja de disparar performance y trend por cada asignación al entrar
- detalle de grupo deja de paginar docentes en cascada desde el cliente
- estadísticas anuales reutilizan el resumen agregado en vez de pedir analytics por separado

Responsabilidad explicita del frontend en esta fase:

- cargar modulos pesados bajo demanda
- cachear respuestas agregadas para evitar refetch redundante
- mantener la UI estable durante cambios de filtros
- decidir que vistas consumen endpoints nuevos y cuales conservan rutas legadas

## Criterios de aceptación

- el build del portal debe quedar dividido por páginas y vendors
- no debe existir un chunk por encima del umbral de advertencia de Vite
- dashboards deben reducir requests respecto al flujo anterior
- cambiar filtros no debe vaciar completamente la UI mientras llega la nueva data
- los endpoints antiguos deben seguir disponibles para compatibilidad

## Riesgos y observaciones

- la cache en memoria no sustituye un cache distribuido
- los uploads en runtime serverless siguen siendo efímeros si usan filesystem temporal
- todavía quedan módulos con fetch manual; esta optimización cubre la primera ola, no toda la aplicación

## Resultado esperado

La optimización debe mejorar tanto rendimiento real como rendimiento percibido:

- menor tiempo de carga inicial
- menor cantidad de requests en dashboards y vistas de detalle
- menos reconstrucción visual al navegar o cambiar filtros
- menor costo de mantenimiento al centralizar fetch y cache en hooks reutilizables
