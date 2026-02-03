# Sistema de Aulas Virtuales - Contexto de Requerimientos

## 1. Situación Problema

### Contexto General

En el contexto educativo actual, se requiere una plataforma virtual de apoyo a las clases presenciales que complemente (no reemplace) los procesos de enseñanza-aprendizaje.

### Problemática Identificada

- **Vacíos en seguimiento y retroalimentación** de aprendizajes
- **Estudiantes con dificultades de asistencia** por razones médicas, conductuales o personales
- **Falta de continuidad** en el proceso de aprendizaje
- **Necesidad de registro y evaluación** mediante herramientas tecnológicas accesibles

### Necesidades Institucionales

- Plataforma que mejore la calidad de enseñanza
- Espacios para compartir información y material de estudio
- Áreas comunes para trabajo colaborativo
- Sistema de asignación de actividades
- Aulas de formación continua para docentes

---

## 2. Requerimientos del Sistema

### 2.1 Requerimientos Funcionales (RF)

#### Autenticación y Usuarios

- **RF01**: Registro y autenticación mediante correo electrónico y contraseña
- **RF02**: Creación y administración de aulas virtuales diferenciadas por tipo de usuario (estudiantes, docentes, administradores)

#### Gestión de Contenidos

- **RF03**: Subida de materiales educativos (presentaciones, PDFs, enlaces, videos)
- **RF04**: Módulos colaborativos (wikis, blogs, foros)
- **RF16**: Integración de herramientas externas para actividades 2.0
- **RF17**: Subida de evidencias y materiales de cursos de formación docente

#### Actividades y Evaluación

- **RF05**: Subida de tareas por estudiantes (formato PDF)
- **RF07**: Calificación de actividades con rúbricas
- **RF08**: Retroalimentación escrita del docente
- **RF09**: Visualización inmediata de notas
- **RF10**: Desglose de calificaciones por actividad
- **RF15**: Registro de fecha/hora de subida de tareas y materiales

#### Colaboración y Comunicación

- **RF11**: Creación de grupos de trabajo (mínimo 3 estudiantes)
- **RF13**: Mensajería interna entre usuarios

#### Administración y Seguimiento

- **RF12**: Acceso a estadísticas de uso (logs, tiempo de conexión, entregas)
- **RF14**: Creación de aulas personalizadas para casos especiales (médicos, etc.)

---

### 2.2 Requerimientos No Funcionales (RNF)

#### Compatibilidad y Accesibilidad

- **RNF-01**: Accesible desde múltiples dispositivos (PC, laptop, celular, tablet)
- **RNF-02**: Compatible con Chrome, Firefox y Safari (mínimo)
- **RNF-03**: Interfaz amigable, intuitiva y responsive

#### Seguridad

- **RNF-04**: Protección de archivos subidos contra edición posterior (PDFs obligatorios)
- **RNF-05**: Privacidad y seguridad de información de usuarios

#### Disponibilidad y Rendimiento

- **RNF-06**: Disponibilidad 24/7
- **RNF-08**: Escalabilidad ante aumento de usuarios
- **RNF-09**: Tiempo de respuesta máximo de 3 segundos por acción

#### Trazabilidad

- **RNF-07**: Registro de trazabilidad del usuario para evidenciar participación
- **RNF-10**: Retroalimentación clara, visible y almacenable

---

## 3. Lista Completa de Requerimientos Iniciales

### Requerimientos Identificados en Entrevista (R-01 a R-23)

| ID   | Descripción                                                       |
| ---- | ----------------------------------------------------------------- |
| R-01 | Acceso mediante usuario y contraseña (registro con email)         |
| R-02 | Ingreso diferenciado para estudiantes, docentes y administradores |
| R-03 | Creación de aulas virtuales por materia y de formación continua   |
| R-04 | Subida de contenido educativo diverso                             |
| R-05 | Recursos colaborativos (wikis, blogs, foros)                      |
| R-06 | Subida de tareas por estudiantes (PDF)                            |
| R-07 | Evaluación continua con rúbricas visibles                         |
| R-08 | Retroalimentación escrita del docente                             |
| R-09 | Visualización inmediata de notas                                  |
| R-10 | Desglose de calificaciones por actividad                          |
| R-11 | Formación de grupos de trabajo (3 estudiantes)                    |
| R-12 | Registro de actividad del usuario (logs)                          |
| R-13 | Disponibilidad multiplataforma                                    |
| R-14 | Accesibilidad desde navegadores principales                       |
| R-15 | Seguimiento de tareas enviadas y calificadas                      |
| R-16 | Mensajería interna                                                |
| R-17 | Aulas específicas para casos especiales                           |
| R-18 | Soporte para actividades 2.0 externas                             |
| R-19 | Gestión de archivos en formatos comunes                           |
| R-20 | Protección contra modificación de archivos                        |
| R-21 | Preservación de know-how docente                                  |
| R-22 | Evidencia de tiempo de conexión y acceso                          |
| R-23 | Envío automatizado de recordatorios                               |

---

## 4. Tipos de Usuario

### 4.1 Estudiantes

- Acceden a materiales de estudio
- Suben tareas y actividades
- Participan en foros y wikis
- Forman grupos de trabajo
- Visualizan calificaciones y retroalimentación

### 4.2 Docentes

- Crean y administran aulas virtuales
- Suben contenido educativo
- Asignan y califican actividades
- Proporcionan retroalimentación
- Acceden a formación continua
- Gestionan grupos de estudiantes

### 4.3 Administradores

- Gestionan usuarios y permisos
- Acceden a estadísticas y logs
- Administran la plataforma global
- Crean aulas especiales según necesidades

---

## 5. Casos de Uso Principales

1. **Gestión de Aulas**: Creación, configuración y administración
2. **Gestión de Contenidos**: Subida, organización y compartición
3. **Gestión de Actividades**: Asignación, entrega y calificación
4. **Colaboración**: Trabajo en grupos, foros, wikis
5. **Evaluación**: Calificación con rúbricas y retroalimentación
6. **Seguimiento**: Monitoreo de participación y rendimiento
7. **Comunicación**: Mensajería y notificaciones

---

## 6. Consideraciones Técnicas

### Tecnologías Sugeridas

- Plataforma web responsive
- Base de datos robusta y escalable
- Sistema de autenticación seguro
- Almacenamiento en la nube
- API para integraciones externas

### Prioridades de Desarrollo

1. Autenticación y gestión de usuarios
2. Creación de aulas y gestión de contenidos
3. Sistema de actividades y evaluación
4. Herramientas colaborativas
5. Sistema de estadísticas y reportes
6. Integraciones y funcionalidades avanzadas

---

**Nota**: Este documento sirve como referencia base para el desarrollo del Sistema de Aulas Virtuales. Los requerimientos pueden refinarse durante el proceso de análisis y diseño.
