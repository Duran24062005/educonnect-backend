# PRD 033 - Onboarding comercial y soporte

## Estado

- Estado: planificado; existen runbooks tecnicos parciales, no un proceso de onboarding repetible.
- Repositorios: `educonnect-backend`, `educonnect-portal` y documentacion operativa.
- Dependencias: PRD 015, PRD 016, PRD 024 y PRD 028.

## Problema y objetivo

Un piloto no es repetible si depende de conocimiento privado del equipo de desarrollo. El objetivo es convertir la puesta en marcha, migracion, capacitacion, soporte y cierre en un proceso con responsables y evidencia.

## Alcance

- Checklist de descubrimiento y configuracion institucional.
- Levantamiento de sedes, jornadas, catalogo, usuarios y reglas.
- Migracion controlada y conciliacion de datos.
- Capacitacion por actor y materiales de uso.
- Canal, severidades, tiempos de respuesta y escalamiento.
- Runbooks de backup, incidente, restauracion y cierre del piloto.
- SLA y soporte comercial solo si se aprueban formalmente.

## No implementado en el corte actual

- No existe checklist operativo aprobado ni sistema de tickets integrado.
- Los runbooks de backup y tenant cubren tareas tecnicas, no todo el onboarding.
- No existe SLA formal ni compromiso de soporte 24/7.

## Actores

- Responsable de implementacion.
- Administrador del colegio.
- Secretaria/coordinacion.
- Docentes y acudientes.
- Soporte y desarrollo.

## Contrato funcional esperado

- Cada institucion tiene una ficha de configuracion, responsables y criterios de salida.
- Cada carga de datos tiene origen, validacion, aprobacion y resultado.
- Los incidentes tienen severidad, responsable, estado y evidencia.
- El soporte no usa datos reales fuera del alcance autorizado.

## Impacto tecnico y documental

- Crear manuales de onboarding y soporte en `docs/`.
- Relacionar checklist con importaciones, reportes, auditoria y staging.
- Definir que eventos operativos generan tickets o notificaciones.

## Criterios de aceptacion

- Una persona nueva puede configurar un sandbox siguiendo la documentacion.
- La institucion recibe capacitacion y material por actor.
- El equipo puede medir tiempos y severidades de soporte.
- El cierre del piloto produce inventario de datos, incidentes, metricas y decision.

## Riesgos y preguntas abiertas

- El SLA depende de costos, horario y capacidad real del equipo.
- La capacitacion debe ajustarse al nivel digital de cada colegio.
- Debe definirse el limite entre soporte funcional y desarrollo a la medida.
