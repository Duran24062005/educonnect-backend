# Commit Conventions

## Format

Use:

`type: :emoji: short description`

Example:

`feat: :sparkles: add private file access validation`

## Allowed Types

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

## Suggested Emoji Catalog

- `:sparkles:` new feature
- `:bug:` bug fix
- `:memo:` documentation
- `:recycle:` refactor
- `:white_check_mark:` tests
- `:wrench:` tooling or configuration
- `:lock:` auth, security, or permissions
- `:rocket:` performance or deployment improvement

## Writing Rules

- keep the description short and concrete
- describe the main user-facing or technical outcome
- use one commit per coherent change when practical
- avoid vague descriptions like `update stuff` or `fix issue`

## Commit by Functionality

Do not collapse a large implementation into one catch-all commit if the work naturally splits into smaller steps.

Prefer commit history like this:

- docs or PRD
- core implementation
- integration wiring
- tests
- cleanup

The goal is for the history to tell the story of what changed and in which order.
