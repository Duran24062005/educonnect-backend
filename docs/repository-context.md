# Backend Repository Context

## Identidad del repositorio

`educonnect-backend` es la API de EduConnect. Su responsabilidad es modelar y exponer el dominio academico mediante contratos HTTP estables y reglas de negocio centralizadas.

Este repositorio no es un monorepo ni una carpeta compartida con `educonnect-portal`. Son repositorios separados y deben documentarse por separado.

## Que se espera documentar aqui

- contratos API
- reglas de negocio del backend
- variables de entorno
- persistencia y modelos
- middlewares y seguridad
- comportamiento de uploads
- seeds, pruebas y forma de ejecutar el servicio

## Que no se debe documentar aqui como fuente principal

- layouts del portal
- routing React
- componentes UI
- estrategias de skeletons y placeholders
- decisiones de code splitting del frontend

Si algo cruza ambos repositorios:

- aqui se documenta el contrato que expone la API
- en el portal se documenta como se consume

## Flujo tecnico del backend

1. `src/index.js` carga configuracion y conecta MongoDB.
2. `src/app.js` crea Express, configura `cors`, parseo JSON, Swagger y static files.
3. Las rutas validan y autentican.
4. Los controladores traducen HTTP a llamadas de servicio.
5. Los servicios aplican reglas de negocio.
6. Los repositories interactuan con Mongoose.
7. `errorHandler` normaliza la respuesta de error.

## Modulos principales

- `auth`: identidad, login, registro, perfil y estado de acceso
- `users`: administracion de usuarios y aprobaciones
- `students`: consultas y operaciones sobre estudiantes
- `academic`: years, periods, grades, areas y aulas
- `groups`: composicion academica y vistas agregadas de grupo
- `evaluations`: notas, resultados, estadisticas y calculos
- `analytics`: dashboards agregados por rol
- `activities`: actividades, entregas y uploads asociados

## Dependencias externas relevantes

- MongoDB como fuente de verdad
- servicio de email via `EMAIL_API_BASE_URL`
- consumidor principal actual: `educonnect-portal`

El backend no debe asumir que el portal es el unico consumidor futuro.

## Contratos con el frontend

El portal depende de:

- codigos HTTP consistentes
- mensajes de error legibles
- `401` para sesion invalida o expirada
- `403` para falta de permisos o cuenta restringida
- payloads agregados en analytics y group detail
- URLs de archivos accesibles bajo `/uploads`

Cuando se cambie alguno de estos puntos:

- documentar el cambio en este repo
- validar impacto en el portal
- coordinar despliegue si hay ruptura de compatibilidad

## Variables de entorno y despliegue

Minimas para un entorno serio:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL` y/o `CORS_ORIGIN`
- `EMAIL_API_BASE_URL`

Detalles operativos:

- `JWT_SECRET` es obligatorio en produccion
- si faltan origins explicitos, CORS usa `FRONTEND_URL` o `http://localhost:3000`
- el backend corre por defecto en `8000`
- Mongo local esperado por defecto: `mongodb://admin:admin123@localhost:27017/educonnect?authSource=admin`

## Uploads

Los uploads locales son parte de la implementacion actual, pero no deben interpretarse como storage definitivo.

Reglas practicas:

- en desarrollo se puede trabajar con `src/uploads`
- en serverless el directorio real pasa a `/tmp/educonnect-uploads`
- cualquier funcionalidad que requiera permanencia o CDN necesita una capa externa adicional

## Testing y calidad

El repo usa pruebas de integracion con Jest + Supertest.

Objetivo de las pruebas actuales:

- proteger flujos criticos
- validar endpoints agregados
- reducir regresiones de permisos y validacion

## Checklist cuando se agrega una funcionalidad

1. definir o actualizar validator
2. exponer o ajustar route
3. mantener controller delgado
4. mover reglas a service
5. encapsular acceso a datos en repository
6. actualizar Swagger o documentacion de API
7. agregar test cuando el cambio afecte contrato o reglas criticas
8. si impacta el portal, coordinar documentacion separada en `educonnect-portal`
