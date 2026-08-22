# PRD 014 - Alcance Comercial y Piloto

## Estado

- Estado: en ejecución, corte P0-9 implementado
- Tipo: alcance de producto y operación
- Piloto: 90 días, una institución, máximo 800 estudiantes
- Repositorios impactados: `educonnect-backend` y `educonnect-portal`
- Documento local: esta carpeta está excluida del tracking de Git mediante `docs/.gitignore`

### Seguimiento de implementación

El primer corte técnico del PRD 014 quedó implementado en el backend:

- Se creó `AuditLog` con actor, rol, acción, entidad, snapshots `before`/`after`, institución opcional, IP, user-agent y metadata.
- Se instrumentaron las mutaciones de calificaciones, matrículas, traslados, cambios de estado de matrícula y asignaciones docentes.
- Los snapshots eliminan credenciales y tokens antes de persistirse.
- La prueba `tests/security-scope.test.ts` valida trazabilidad de una calificación y una matrícula mediante la API.

Este corte no aprueba todavía el gate P0 ni habilita datos reales. `institution_id` sigue siendo opcional durante la migración del PRD 016. La consulta administrativa de auditoría se implementó en el corte P0-2; todavía no existe una transacción que agrupe mutación y auditoría, por lo que ese riesgo permanece abierto para los PRDs 016 y 018.

### Seguimiento de implementación: corte P0-2

También quedó implementado un segundo corte de fundamentos operativos:

- Los tokens nuevos contienen `jti` y se respaldan en `Session`, con expiración, logout revocable y revocación administrativa.
- Se añadieron `GET /api/users/:id/sessions` y `DELETE /api/users/:id/sessions/:jti` para revisión y revocación por admin.
- Se añadió el readiness check `GET /health/ready`, que verifica la conexión con MongoDB.
- Se añadieron scripts documentados de `mongodump` y `mongorestore`, con backups excluidos de Git.
- Se añadió el bootstrap de una institución en sandbox y la vinculación inicial de usuarios mediante `institution_id`.

El aislamiento completo todavía no está aprobado: la barrera tenant está opt-in hasta migrar los datos legacy y verificar los índices. El procedimiento de backup está preparado, pero el gate no se considera aprobado hasta ejecutar y documentar una restauración real. Los tokens antiguos sin `jti` se aceptan únicamente como transición de migración y no son revocables individualmente.

### Seguimiento de implementación: corte P0-3

Se incorporó la barrera técnica de multi-tenancy:

- El contexto de institución se conserva por petición con `AsyncLocalStorage`.
- Los modelos tenant-owned asignan `institution_id` en altas y filtran lecturas, actualizaciones, eliminaciones y agregaciones cuando `TENANT_DATA_ISOLATION=true`.
- Las rutas protegidas pueden exigir contexto mediante `REQUIRE_INSTITUTION_CONTEXT=true`.
- Los índices únicos relevantes incluyen institución para evitar colisiones entre colegios.
- `scripts/migrate-tenant.ts` asigna registros legacy a una institución indicada, sincroniza índices y exige confirmación explícita.
- `tests/tenant-isolation.test.ts` prueba que una institución no puede leer registros de otra.

La barrera está opt-in hasta completar la migración en staging. El gate P0 permanece bloqueado mientras no exista evidencia de backup restaurado, migración ejecutada, flags activados y pruebas cross-tenant sobre datos reales de staging.

### Seguimiento de implementación: cortes P0-4 a P0-6

Se implementó la primera slice operativa de asistencia, una de las capacidades críticas del piloto:

- `AttendanceSession` y `AttendanceRecord` cubren sesiones por grupo y estados por estudiante.
- La sesión se inicializa con estudiantes de matrícula activa y exige que los registros pertenezcan al grupo.
- Administración puede crear, consultar, cerrar y reabrir sesiones; docentes solo operan sus grupos asignados.
- Se soportan estados pendiente, presente, ausente, tarde y justificada; las justificaciones requieren texto y quedan auditadas.
- Estudiantes, docentes, administración y acudientes pueden consultar únicamente el resumen autorizado.
- El portal incorpora `/attendance` para operación y muestra asistencia separada por estudiante en el dashboard familiar.
- Se expuso el boletín básico por estudiante vinculado en `/family/bulletins`, reutilizando datos reales del año y periodo.
- La consulta del boletín comprueba el vínculo autorizado antes de aceptar el `student_id`; el boletín oficial firmado continúa reservado para el PRD 025.
- El calendario persistente admite consulta familiar en `/calendar`, limitado a los grupos con matrícula activa de los estudiantes autorizados.
- El cierre de periodos bloquea mutaciones de calificaciones hasta una reapertura administrativa auditada.
- El año lectivo admite escala mínima/máxima, umbral de aprobación y niveles de desempeño base; el dashboard y boletín usan esa política para decidir estados.
- La importación CSV controlada permite previsualizar, validar por fila y confirmar estudiantes, acudientes, docentes, grados, áreas, grupos y matrículas.
- Las cargas se registran en `ImportJob` y auditan la previsualización y confirmación; XLSX y exportaciones ampliadas quedan para el PRD 024, mientras que jobs, reintentos y escala quedan trazados en el PRD 031.
- Los anuncios administrativos y docentes pueden llegar a acudientes autorizados, deduplicando un acudiente que tenga varios estudiantes.
- Se añadieron catalogos tenant-owned de sedes y jornadas, con CRUD administrativo, desactivacion logica y referencias opcionales en matricula e importacion CSV.
- Se añadió un reporte institucional de asistencia en JSON y CSV, filtrable por año, grupo y rango de fechas, con descarga administrativa desde el portal.
- Se añadió exportación CSV del padrón de matrículas con grupo, grado, sede y jornada, disponible desde la administración de matrículas.
- Se añadieron pruebas de API para crear, actualizar, cerrar y consultar dos estudiantes vinculados, además de pruebas frontend del panel familiar.

Estos cortes no resuelven todavía el gate de staging, el expediente legal y consentimientos, aprobación institucional de excusas, notificaciones automáticas de asistencia, reportes institucionales adicionales, XLSX/jobs de importación ni sincronización externa del calendario.

## Referencias

- [Roadmap comercial local](../../docs/task-to-make-educonnect-comercial/README.md)
- [Registro canónico de PRDs](./README.md)
- [Auditoría de EduConnect](../../docs/Auditoria_Educonnect_ChatGPT.md)
- [PRD 013 - Calendario de clases](../../educonnect-backend/prds/013-calendar-class-schedule.md)

Los PRDs 015 a 034 están documentados en el registro canónico. Cada uno declara si su alcance está implementado parcialmente o si sigue planificado; la existencia del documento no implica que la capacidad esté lista para producción.

## Objetivo

Definir el primer producto comercial validable de EduConnect y las condiciones operativas de un piloto de 90 días para una institución educativa de hasta 800 estudiantes.

El producto debe ofrecer un núcleo común para colegios privados y públicos, con una experiencia suficiente para operar procesos académicos reales. No debe presentarse como reemplazo de SIMAT, SINEB o SIUCE ni prometer integraciones oficiales que no estén respaldadas por una API documentada o un convenio válido.

## Problema

EduConnect cuenta con una base funcional para usuarios, grupos, actividades, calificaciones, analítica y boletines básicos, pero todavía no tiene las garantías de datos, seguridad y operación necesarias para venderse como sistema escolar institucional.

En el estado actual no existe una definición única de qué significa estar listo para un colegio piloto. Esto puede provocar que se incorporen datos reales de menores antes de completar aislamiento institucional, auditoría, backups, permisos, expediente, matrícula, asistencia y flujos de acudientes.

El PRD establece una frontera comercial verificable: qué se probará, con quién, bajo qué condiciones, qué métricas determinarán el resultado y qué capacidades quedan explícitamente fuera.

## Resultado esperado

Al terminar el piloto debe ser posible demostrar que una institución puede:

- Configurar su contexto institucional y académico.
- Importar y validar sus datos iniciales.
- Administrar estudiantes, acudientes y matrículas.
- Asignar docentes, grupos y asignaturas.
- Registrar calificaciones y asistencia.
- Gestionar el calendario de clases.
- Emitir un boletín básico.
- Permitir al acudiente consultar la información autorizada.
- Operar con trazabilidad, aislamiento de datos y recuperación ante incidentes.

## Cliente objetivo

El producto se diseñará para una institución educativa colombiana pequeña o mediana, privada o pública, que necesite digitalizar sus procesos académicos principales sin depender completamente de hojas de cálculo.

El primer piloto tendrá estas restricciones:

- Una sola institución.
- Hasta 800 estudiantes.
- Uno o varios contextos de sede y jornada según la configuración real de la institución.
- Un año lectivo operativo durante el piloto.
- Datos sintéticos durante la etapa de preparación.
- Datos reales solo después de aprobar el gate P0.

## Alcance funcional del piloto

### 1. Configuración institucional

Debe permitir configurar la información necesaria para operar el colegio:

- Institución y datos básicos.
- Sedes.
- Jornadas.
- Año lectivo.
- Periodos académicos.
- Grados y grupos.
- Áreas y asignaturas.
- Aulas y espacios de clase.

La configuración debe estar asociada a una institución y no depender de variables de entorno como solución definitiva.

### 2. Usuarios, roles y permisos

El piloto debe incluir autenticación y autorización suficientes para los actores definidos en este PRD:

- Secretaría.
- Rector o coordinador.
- Docente.
- Estudiante.
- Acudiente.

Durante el piloto, el rol técnico actual `admin` podrá representar temporalmente a secretaría y rector/coordinación. Esta equivalencia debe quedar documentada y controlada. La separación de permisos granulares y roles institucionales se implementará en el PRD 017.

Como mínimo, el sistema debe restringir:

- El acceso a la institución correspondiente.
- El acceso del docente a sus grupos y asignaciones.
- El acceso del estudiante a sus propios datos.
- El acceso del acudiente únicamente a los estudiantes vinculados y autorizados.
- Las acciones administrativas a los usuarios autorizados.

### 3. Expediente de estudiante y acudiente

Debe existir una relación verificable entre estudiante y acudiente, incluyendo como mínimo:

- Identidad y datos de contacto.
- Parentesco o tipo de relación.
- Estado de la relación.
- Responsabilidades o autorizaciones relevantes.
- Historial básico del estudiante.
- Documentos requeridos para el proceso de matrícula, aunque la emisión documental avanzada quede fuera de esta fase.

### 4. Matrícula

El piloto debe cubrir la matrícula por:

- Año lectivo.
- Institución y sede.
- Jornada.
- Grado.
- Grupo.

Debe contemplar estados y eventos básicos de ciclo de vida:

- Matrícula activa.
- Traslado.
- Retiro.
- Reingreso.
- Promoción o continuidad al siguiente año.

Las decisiones que cambien el estado de una matrícula deben quedar auditables.

### 5. Asignaturas y carga académica

El modelo debe diferenciar área de asignatura y permitir relacionar:

- Grado.
- Asignatura.
- Grupo.
- Docente.
- Periodo o año lectivo.
- Intensidad o carga académica cuando aplique.

Esta relación será la base de la libreta de calificaciones, asistencia y calendario.

### 6. SIEE, calificaciones y cierre de periodos

El piloto debe permitir configurar y aplicar una versión inicial del SIEE institucional:

- Escala institucional.
- Equivalencias o niveles de desempeño.
- Pesos y reglas de cálculo.
- Criterios de aprobación.
- Registro de calificaciones por grupo, asignatura y periodo.
- Historial de cambios de calificaciones.
- Cierre y reapertura controlada de periodos.
- Recuperaciones o nivelaciones cuando estén contempladas por la configuración institucional.

La escala 0-10 y la aprobación hardcodeada no deben permanecer como regla comercial general.

### 7. Asistencia

El piloto debe permitir:

- Crear sesiones de asistencia.
- Registrar asistencia por estudiante.
- Diferenciar estados de asistencia.
- Registrar justificaciones.
- Consultar historial por estudiante, grupo y periodo.
- Mostrar información autorizada al acudiente.

### 8. Calendario de clases

El calendario debe evolucionar desde la demo actual a un flujo operativo conectado con los datos institucionales:

- Horario y sesión de clase.
- Inicio y finalización.
- Grupo, grado, asignatura, docente y aula.
- Tema de la sesión.
- Actividades relacionadas.
- Consulta por docente y estudiante.
- Filtros institucionales para administración.
- Cancelación de una clase.
- Reactivación de una clase cancelada por un usuario autorizado.
- Validación de conflictos de horario, aula, grupo y docente.

La persistencia y autorización se definirán mediante la evolución del [PRD 013](../../educonnect-backend/prds/013-calendar-class-schedule.md).

### 9. Boletín básico

El piloto debe entregar un boletín básico basado en datos reales del periodo:

- Estudiante.
- Institución.
- Año y periodo.
- Asignaturas o áreas.
- Calificaciones y niveles.
- Observaciones disponibles.
- Fecha de generación.

El boletín oficial PDF con snapshots, firmas, consecutivos y verificación avanzada se especificará en el PRD 025. El HTML actual no debe venderse como documento académico oficial.

### 10. Importación inicial

El piloto debe contar con un mecanismo controlado para cargar datos desde Excel o CSV, al menos para:

- Estudiantes.
- Acudientes.
- Grados y grupos.
- Docentes.
- Asignaturas.
- Matrículas.

El flujo debe incluir validación previa, reporte de errores por fila, confirmación antes de guardar y registro de la ejecución. La importación funcional se documenta en el PRD 024; el motor general de jobs, reintentos y escala se documenta en el PRD 031.

### 11. Portal de acudiente

El acudiente debe poder consultar únicamente la información de los estudiantes vinculados:

- Datos académicos autorizados.
- Calificaciones.
- Asistencia.
- Calendario o próximas clases.
- Boletines.
- Comunicaciones institucionales disponibles.

Las solicitudes avanzadas de certificados, permisos y excusas quedan para una fase posterior si no son necesarias para el flujo del piloto.

## Alcance operativo

### Onboarding

El onboarding del colegio debe incluir:

1. Identificación de la institución y responsables.
2. Confirmación del alcance y exclusiones.
3. Levantamiento de estructura institucional y académica.
4. Preparación de archivos de datos.
5. Configuración del sandbox.
6. Importación y validación de datos sintéticos.
7. Capacitación básica por actor.
8. Ejecución del checklist P0.
9. Autorización explícita para usar datos reales.

### Capacitación

Debe existir material mínimo para:

- Secretaría.
- Rector o coordinador.
- Docente.
- Estudiante.
- Acudiente.

La capacitación debe cubrir tareas diarias y la ruta de reporte de incidentes, no solamente una demostración de pantallas.

### Soporte

El piloto tendrá soporte bajo demanda, sin SLA contractual ni cobertura 24/7.

Debe existir, como mínimo:

- Un canal único de soporte.
- Registro de solicitudes.
- Clasificación por impacto.
- Responsable de seguimiento.
- Fecha de resolución o decisión.
- Revisión semanal de incidentes y bloqueos.

El soporte informal no elimina la necesidad de registrar los problemas del piloto; esos registros serán parte de la decisión final.

### Revisión semanal

Cada semana se revisarán:

- Usuarios activos por actor.
- Datos faltantes o inválidos.
- Matrículas y asignaciones pendientes.
- Calificaciones y asistencia registradas.
- Uso del calendario.
- Incidentes y solicitudes de soporte.
- Riesgos de privacidad o permisos.

## Flujo completo del piloto

1. Definir la institución, sus responsables y el alcance aprobado.
2. Configurar el sandbox institucional.
3. Importar datos sintéticos.
4. Ejecutar pruebas de matrícula, asignaciones, calificaciones, asistencia, calendario y boletín.
5. Revisar y aprobar el gate P0.
6. Habilitar datos reales únicamente con autorización registrada.
7. Operar durante 90 días.
8. Medir adopción, cobertura, disponibilidad, incidentes y calidad de datos.
9. Emitir una decisión de continuar, corregir o detener.

## Fuera de alcance

El PRD 014 no incluye:

- Reemplazo de SIMAT, SINEB o SIUCE.
- Integraciones oficiales sin API documentada o convenio.
- Promesas de cumplimiento legal automático.
- Pagos, cartera o facturación.
- Transporte.
- Biblioteca.
- Enfermería.
- Comedor.
- Inventario.
- Apps móviles nativas.
- IA generativa amplia.
- Blockchain.
- Microservicios.
- Pricing, contratos comerciales o facturación.
- SLA formal o soporte 24/7.

## Interfaces y dependencias

### Contratos

El PRD 014 no introduce endpoints, modelos, migraciones ni cambios de payload. Define criterios de producto y operación.

Los contratos técnicos y el trabajo pendiente quedan trazados en los PRDs posteriores:

- [PRD 015 - Producción, backups y observabilidad](../../educonnect-backend/prds/015-production-foundation.md)
- [PRD 016 - Multi-tenancy e institución](../../educonnect-backend/prds/016-multi-tenancy-institutional-structure.md)
- [PRD 017 - Seguridad, sesiones y permisos](../../educonnect-backend/prds/017-security-sessions-and-permissions.md)
- [PRD 018 - Auditoría, consentimiento y cumplimiento](../../educonnect-backend/prds/018-audit-consent-and-compliance.md)
- [PRD 019 - Estudiantes, acudientes y expediente](../../educonnect-backend/prds/019-student-guardian-record.md)
- [PRD 020 - Ciclo de vida de matrícula](../../educonnect-backend/prds/020-enrollment-lifecycle.md)
- [PRD 021 - Catálogo académico y asignaciones](../../educonnect-backend/prds/021-academic-catalog-and-teaching-assignments.md)
- [PRD 022 - SIEE, gradebook y cierre de periodos](../../educonnect-backend/prds/022-siee-gradebook-and-period-closure.md)
- [PRD 023 - Asistencia](../../educonnect-backend/prds/023-attendance.md)
- [PRD 024 - Importación, exportación y migración](../../educonnect-backend/prds/024-import-export-and-migration.md)
- [PRD 025 - Boletines oficiales](../../educonnect-backend/prds/025-official-bulletins.md)
- [PRD 026 - Certificados y documentos académicos](../../educonnect-backend/prds/026-academic-certificates-and-documents.md)
- [PRD 027 - Portal de acudiente](../../educonnect-backend/prds/027-guardian-portal.md)
- [PRD 028 - Reportes institucionales](../../educonnect-backend/prds/028-institutional-reports.md)
- [PRD 029 - Comunicaciones escolares](../../educonnect-backend/prds/029-school-communications.md)
- [PRD 030 - Observador, convivencia y conducta](../../educonnect-backend/prds/030-student-observations-and-conduct.md)
- [PRD 031 - Jobs asincronos y escala comercial](../../educonnect-backend/prds/031-async-jobs-and-commercial-scale.md)
- [PRD 032 - Reportes e integraciones colombianas](../../educonnect-backend/prds/032-colombian-reporting-integrations.md)
- [PRD 033 - Onboarding comercial y soporte](../../educonnect-backend/prds/033-commercial-onboarding-and-support.md)
- [PRD 034 - Analitica de diferenciacion](../../educonnect-backend/prds/034-differentiation-analytics.md)

### Dependencias de producto

- El PRD 015 debe aprobar backups, restauración y observabilidad antes de datos reales.
- El PRD 016 debe definir el aislamiento de institución antes de crear nuevas entidades escolares.
- El PRD 017 debe asegurar sesiones, MFA administrativo y permisos contextuales.
- El PRD 018 debe registrar cambios sensibles y consentimientos de menores.
- Los PRDs 019-023 deben entregar el núcleo escolar usado por el piloto.
- El PRD 013 debe completar la persistencia y autorización del calendario.
- Los PRDs 024-029 deben cubrir migración, boletín, documentos, portal, reportes y comunicaciones comerciales.

## Gate P0 para datos reales

El uso de datos reales debe bloquearse hasta demostrar todos los siguientes puntos:

### Aislamiento de tenant

- Una institución no puede consultar, modificar ni inferir datos de otra.
- Existen pruebas automatizadas de aislamiento.
- Las unicidades e índices relevantes incluyen el contexto institucional.

### Revocación de sesión

- Una sesión cerrada o revocada no puede seguir accediendo a la API.
- Los administradores pueden revisar y revocar sesiones según el PRD 017.

### Auditoría

- Se registra actor, fecha, entidad, acción y valores anterior/nuevo para notas, matrículas, usuarios y documentos.
- Los eventos no se pueden alterar desde los flujos normales de usuario.

### Backup y restauración

- Existe backup automático.
- Se ha ejecutado una restauración completa en un ambiente controlado.
- El resultado de la restauración está documentado.

### Protección de datos de menores

- Existe una política de tratamiento aplicable al piloto.
- Se registran consentimientos y responsables cuando corresponda.
- Los documentos y datos sensibles tienen acceso restringido.

### Permisos por actor

- Secretaría y rector/coordinación no comparten necesariamente todas las capacidades en el diseño final.
- El docente solo opera sobre sus asignaciones.
- El acudiente solo consulta estudiantes vinculados.
- El estudiante solo consulta sus propios datos.

## Criterios de éxito

El piloto se considerará exitoso únicamente si cumple todos los criterios siguientes:

- Cero incidentes críticos durante el piloto.
- Disponibilidad mínima de 99.5% durante el periodo medido.
- Al menos 98% de los registros de la carga inicial migrados correctamente.
- Al menos 90% de los docentes activos semanalmente.
- Al menos 80% de los acudientes activados.
- Todos los cambios de notas, matrículas y documentos trazables.
- Todos los usuarios restringidos a su institución y relación autorizada.
- Restauración de backup ejecutada y aprobada antes de datos reales.
- Flujo completo validado: importar, matricular, calificar, tomar asistencia, cerrar periodo, emitir boletín y consultar desde acudiente.
- Decisión final sustentada en métricas, incidentes y retroalimentación documentada.

La disposición a pagar, renovación y referencias comerciales se evaluarán como señales de negocio posteriores. No forman parte de este PRD porque pricing, contratos y facturación están fuera de alcance.

## Criterios de aceptación del PRD

- El documento identifica problema, objetivo, cliente, escala y duración del piloto.
- El alcance incluye el núcleo escolar completo definido en este documento.
- Cada actor tiene responsabilidades y límites de acceso explícitos.
- El flujo operativo cubre sandbox, gate P0, uso real, seguimiento semanal y cierre.
- Las métricas tienen umbrales numéricos verificables.
- El gate P0 bloquea explícitamente el uso de datos reales ante cualquier fallo crítico.
- Las dependencias con los PRDs 013 y 015-034 están enlazadas o identificadas con estado explícito.
- El documento no crea ni promete endpoints, modelos o integraciones oficiales.
- Las exclusiones impiden interpretar EduConnect como reemplazo de sistemas oficiales o como suite administrativa completa.
- El roadmap comercial enlaza este PRD cuando el documento se incorpore formalmente al flujo de trabajo.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Intentar atender de igual forma a colegios públicos y privados desde el primer día | Alcance inmanejable | Mantener un núcleo común y excluir reemplazo de sistemas oficiales. |
| Usar datos reales antes del gate P0 | Riesgo legal y de privacidad | Sandbox obligatorio, aprobación registrada y criterios bloqueantes. |
| El rol `admin` concentra demasiadas capacidades | Cambios no autorizados | Documentar la limitación temporal y ejecutar permisos granulares en PRD 017. |
| Importación deficiente desde Excel/CSV | Retrabajo y datos incorrectos | Prevalidación, errores por fila, confirmación y registro de carga. |
| Baja adopción docente o de acudientes | Piloto sin valor comercial | Revisiones semanales, capacitación por actor y métricas de adopción. |
| Confundir boletín básico con documento oficial | Riesgo operativo y reputacional | Reservar emisión oficial para PRD 025 y documentos verificables para PRD 026. |
| Soporte informal sin trazabilidad | Problemas repetidos y falta de aprendizaje | Canal único, registro de solicitudes y revisión semanal aunque no exista SLA. |
| Prometer integraciones no disponibles | Pérdida de confianza | Limitarse a exportaciones o convenios documentados. |

## Validación del documento

Antes de considerar terminado este PRD se debe comprobar:

- El alcance coincide con la auditoría y el roadmap comercial.
- Ninguna sección promete reemplazar SIMAT, SINEB o SIUCE.
- Cada capacidad del piloto tiene una dependencia técnica identificada.
- Los criterios de éxito se pueden medir con datos del sistema.
- Los enlaces relativos apuntan al roadmap y al PRD 013 existente.
- El archivo pasa `git diff --check` cuando se revise desde un repositorio que lo incluya.

No se requieren pruebas de frontend o backend para este cambio documental.
