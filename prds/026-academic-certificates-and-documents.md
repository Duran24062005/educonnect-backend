# PRD 026 - Certificados y documentos academicos

## Estado

- Estado: no iniciado; el almacenamiento privado existe como capacidad reutilizable.
- Repositorios: `educonnect-backend` y `educonnect-portal`.
- Dependencias: PRD 018, PRD 020, PRD 022 y PRD 025.

## Problema y objetivo

Un certificado descargable no es confiable si no tiene consecutivo, fuente academica congelada, control de acceso y mecanismo de verificacion. El objetivo es emitir constancias y certificados academicos con ciclo de vida, privacidad y revocacion.

## Resultado de la planeacion

- Reutilizar el storage privado del PRD 011, sin exponer buckets publicos.
- Separar plantillas, solicitudes, documentos emitidos y verificaciones.
- Generar documentos a partir de datos autorizados y snapshots.
- No prometer validez oficial nacional ni integracion con entidades externas.

## Alcance

- Certificado de estudio, constancia de matricula y documentos definidos por la institucion.
- Solicitud, aprobacion, emision, descarga, revocacion y reemision.
- PDF privado con consecutivo y metadatos.
- QR o pagina de verificacion con informacion minima.
- Retencion, auditoria y permisos por rol.

## Estado actual

### Implementado

- Existe almacenamiento privado y URLs firmadas para algunos archivos del producto.
- El boletin basico entrega datos academicos, no un certificado emitido.

### Pendiente

- Catalogo de tipos de documento y plantillas.
- Modelo de solicitud y emision.
- Generacion PDF, consecutivos y verificacion.
- Revocacion y expiracion de enlaces.
- Reglas de aprobacion y tarifas, si la institucion las define.

## Actores

- Estudiante o acudiente como solicitante autorizado.
- Secretaria como emisor.
- Rector como aprobador opcional.
- Tercero verificante con acceso limitado al documento.

## Contrato funcional esperado

- El futuro recurso debe separar solicitud de documento emitido.
- Las URLs de descarga deben ser temporales y no reutilizables indefinidamente.
- La verificacion debe responder solo los datos necesarios para validar autenticidad.
- Revocar un documento invalida su verificacion sin borrar la evidencia.

## Impacto tecnico

- Modelos de document request, emitted document, template y verification.
- Integracion con storage, auditoria y jobs del PRD 031.
- Indices por tenant, consecutivo y estado.

## Criterios de aceptacion

- Un certificado emitido conserva un snapshot reproducible.
- La descarga respeta tenant, rol, vinculo y vigencia.
- Un tercero puede verificar un documento sin acceder al expediente completo.
- La revocacion queda auditada y es visible en la verificacion.
- Los documentos y enlaces no aparecen en logs ni respuestas no autorizadas.

## Riesgos y preguntas abiertas

- Debe definirse que documentos tienen valor institucional y quien los firma.
- La politica de retencion debe coordinarse con PRD 018.
- El formato de QR no debe revelar datos personales innecesarios.
