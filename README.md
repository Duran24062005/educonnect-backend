<p align="center">
  <a href="https://edu-connect-beta.vercel.app/">
    <img src="https://edu-connect-beta.vercel.app/img/EduConectLogo.png" height="96">
    <h1 align="center">EduConnect</h1>
  </a>
</p>

<p align="center">Simple Next.j 14 boilerplate that uses <a href="https://fastapi.tiangolo.com/">FastAPI</a> as the API backend.</p>

<br/>

EduConnect es una plataforma educativa integral diseñada para facilitar la gestión académica y mejorar la comunicación entre estudiantes, maestros y padres. Este proyecto es una iniciativa abierta, donada a [Nombre de la Escuela], con el objetivo de proporcionar a los estudiantes una oportunidad de aprendizaje práctico en desarrollo de software.

## Objetivo del Proyecto

El objetivo principal de EduConnect es no solo ofrecer una herramienta útil para la gestión académica, sino también brindar a los estudiantes que decidan hacer parte, la oportunidad de aprender y desarrollar habilidades en programación, desarrollo web, y gestión de proyectos. A largo plazo, la idea es que los estudiantes puedan ganar experiencia mientras reciben un apoyo económico por el mantenimiento de la aplicación.

## Funcionalidades Clave

- **Gestión de Estudiantes**: Crear, actualizar y eliminar perfiles de estudiantes.
- **Gestión de Notas y Materias**: Registro y actualización de notas, administración de perfiles de materias.
- **Portal de Maestros**: Acceso exclusivo para la gestión de calificaciones e informes.
- **Consultas y Reportes**: Generación de informes académicos y análisis educativos.
- **Portal para Padres**: Consulta de notas y comunicación directa con los maestros.

## Tecnologías Utilizadas

- **Backend**:
  - Python (FastApi)
  - Frameworks: FastApi
  - Base de Datos: PostgreSQL
- **Seguridad**:
  - Autenticación y Autorización: JWT, OAuth
  - Encriptación de Contraseñas: bcrypt
- **Frontend**:
  - Framework: Next.js
  - Componentes: React
  - Estilos: CSS, Tailwind CSS

## Cómo Contribuir

Este proyecto es de código abierto y cualquier persona interesada puede contribuir. Si eres un estudiante de [Nombre de la Escuela] y te gustaría participar, sigue estos pasos:

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/Duran24062005/educonnect-backend.git
   ```

2. **Configura tu entorno de desarrollo**:

   ### Opción 1: Instalación Local (sin Docker)

   ```bash
   # Crear entorno virtual
   python3 -m venv venv

   # Activar entorno virtual
   source venv/bin/activate  # En Linux/Mac
   # o
   venv\Scripts\activate  # En Windows

   # Instalar dependencias
   pip install -r requirements.txt

   # Ejecutar servidor
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   El servidor estará disponible en: `http://localhost:8000`

   ### Opción 2: Usando Docker

   ```bash
   # Construir imagen
   docker build -t educonnect-api .

   # Ejecutar contenedor
   docker run -p 8000:8000 educonnect-api
   ```

   ### Opción 3: Usando Docker Compose (Recomendado)

   ```bash
   # Levantar servicios
   docker-compose up

   # Para detener
   docker-compose down
   ```

   El servidor estará disponible en: `http://localhost:8000`

3. **Endpoints disponibles**:
   - `GET /` - Raíz de bienvenida
   - `GET /health` - Verificar estado de la aplicación
   - `GET /api/hello` - Ejemplo de endpoint
   - `GET /docs` - Documentación interactiva (Swagger UI)
   - `GET /redoc` - Documentación alternativa (ReDoc)

## Despliegue en Vercel

El proyecto está configurado para desplegarse fácilmente en Vercel. Sigue estos pasos:

1. **Requisitos previos**:
   - Cuenta en [Vercel](https://vercel.com)
   - Tu código en un repositorio de GitHub, GitLab o Bitbucket

2. **Desplegar**:

   ```bash
   # Opción 1: Usar Vercel CLI
   npm i -g vercel
   vercel

   # Opción 2: Conectar desde Vercel Dashboard
   # - Ve a https://vercel.com/new
   # - Selecciona tu repositorio
   # - Vercel detectará automáticamente que es un proyecto Python/FastAPI
   # - Haz clic en "Deploy"
   ```

3. **Variables de entorno** (si es necesario):
   - Configura las variables de entorno en el dashboard de Vercel
   - El archivo `vercel.json` ya contiene la configuración necesaria

4. **URL de producción**:
   - Tu API estará disponible en: `https://tu-proyecto.vercel.app`
   - Documentación disponible en: `https://tu-proyecto.vercel.app/docs`

## Estructura del Proyecto

```
educonnect-backend/
├── app/
│   └── main.py          # Aplicación principal FastAPI
├── venv/                # Entorno virtual (generado localmente)
├── .gitignore          # Archivos a ignorar en Git
├── docker-compose.yml   # Configuración de Docker Compose
├── Dockerfile          # Configuración de Docker
├── requirements.txt    # Dependencias de Python
├── vercel.json         # Configuración de Vercel
└── README.md           # Este archivo
```

4. **Contribuye**:
   - Desarrolla nuevas funcionalidades.
   - Corrige errores.
   - Mejora la documentación.
   - Participa en las discusiones del proyecto.

5. **Envía tus cambios**:
   - Crea una nueva rama para tus cambios.
   - Haz un pull request explicando lo que has añadido o modificado.

## Cómo Ayudará a los Estudiantes

EduConnect no solo es una herramienta práctica, sino también una plataforma educativa. Al participar en su desarrollo y mantenimiento, los estudiantes obtendrán:

- **Experiencia Práctica**: Trabajar en un proyecto real, aplicando conocimientos de programación, desarrollo web, y bases de datos.
- **Apoyo Económico**: Con el tiempo, el mantenimiento de la aplicación generará ingresos, los cuales se utilizarán para apoyar económicamente a los estudiantes que contribuyan al proyecto.
- **Desarrollo Profesional**: La experiencia obtenida será valiosa para el desarrollo de sus futuras carreras en tecnología.

## Licencia

Este proyecto está licenciado bajo licencia de código de propietario. Consulta el archivo `LICENSE` para más detalles.

---
