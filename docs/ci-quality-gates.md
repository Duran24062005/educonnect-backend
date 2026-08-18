# CI Quality Gates

## Purpose

Documentar como el backend protege `main` con revision previa y validaciones automatizadas.

## Scope

- Cubre el workflow `.github/workflows/build_and_test.yaml` de `educonnect-backend`.
- Cubre la revision requerida por PR, `CODEOWNERS` y plantilla de PR.
- No cubre el CI del portal; ese repositorio mantiene su propio workflow y documentacion.

## Context

`educonnect-backend` y `educonnect-portal` son repositorios Git independientes. Cada repo debe validar sus propios cambios, aunque ambos compartan dominio funcional y contratos HTTP.

La meta de este flujo es evitar que tests/build corran sobre codigo que todavia no tiene una revision humana minima, y asegurar que los cambios aprobados pasen verificaciones reproducibles antes de entrar a `main`.

## Current Behavior

El workflow se dispara en:

- `pull_request` hacia `main`
- `pull_request_review` cuando una revision se envia o se descarta
- `push` directo a `main`

En PRs, el job `Review gate` corre antes del job `Quality gates`. El gate exige:

- PR no marcado como draft
- al menos una aprobacion de una persona distinta al autor
- aprobacion hecha sobre el ultimo commit del PR
- ninguna solicitud de cambios activa sobre ese ultimo commit

Si se empuja un commit nuevo, las aprobaciones anteriores no desbloquean CI. El PR debe revisarse otra vez.

En `main`, el workflow corre las validaciones directamente porque el codigo ya debio haber pasado por PR.

## Key Decisions

- El workflow vive en este repo porque GitHub Actions solo ve el contenido del repositorio que lo ejecuta.
- `CODEOWNERS` asigna todos los archivos a `@Duran24062005`; para que sea obligatorio debe activarse la regla de proteccion correspondiente en GitHub.
- `yarn install --frozen-lockfile --non-interactive` evita que CI cambie dependencias o lockfile.
- `yarn quality` es el comando unico de calidad del backend y ejecuta `typecheck`, `test` y `build`.
- El workflow usa permisos minimos: lectura de contenido y lectura de pull requests.

## Contracts or Interfaces

- Runtime de proyecto en CI: Node.js 20.
- Gestor de paquetes: Yarn classic con `yarn.lock`.
- Checks bloqueantes:
  - `Review gate`
  - `Quality gates`
- Comando local equivalente:

```bash
yarn quality
```

## Operational Notes

Para que la revision sea obligatoria antes de merge, configurar en GitHub para la rama `main`:

- Require a pull request before merging.
- Require approvals.
- Require review from Code Owners.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging.
- Marcar como requeridos `Review gate` y `Quality gates`.

Si un PR queda bloqueado con el mensaje de aprobacion faltante, pedir revision y aprobar el ultimo commit. El evento `pull_request_review` vuelve a ejecutar el workflow.

## Maintenance Notes

- Si cambia la version de Node soportada por el backend, actualizar `README.md`, `package.json` si aplica y el workflow.
- Si cambian los comandos de prueba o build, actualizar `yarn quality` y este documento.
- Si cambia el ownership del repo, actualizar `.github/CODEOWNERS`.
