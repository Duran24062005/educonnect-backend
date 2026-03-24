# EduConnect Backend Conventions

## Commit Messages

When creating commits in this repository, use:

`type: :emoji: short description`

Preferred types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

## Commit Strategy

Do not default to a single large commit when the work includes multiple logical steps.

Prefer a sequence of small commits that explains the implementation flow.

Examples of good commit boundaries:

- documentation or PRD setup
- schema or model changes
- service or business-rule implementation
- route or controller integration
- tests
- cleanup or follow-up refactor

If a request includes many changed files, group them by functionality or concern and commit them separately when the boundaries are clear.

## Backend Feature Planning

For a new backend feature, start in plan mode first when the user indicates feature work.

Create or update a PRD in `prds/` from the planning results when the work is more than a small isolated fix.

Use the next numeric prefix and a kebab-case slug.

Example:

- `012-example-feature-name.md`

The PRD should summarize:

- problem and goal
- scope
- planning outcome and implementation approach
- affected roles or actors
- data model or storage impact
- API or contract impact
- validation and authorization rules
- risks, migrations, and open questions

The backend repository must remain understandable on its own, even if the agent had extra context from the workspace root.

## Backend Documentation

Create or update a file in `docs/` when the change affects:

- API behavior
- authentication or authorization
- storage or infrastructure
- background processing
- developer workflows
- architecture or repository conventions

Prefer updating an existing doc when it already covers the same area.

If a decision only lives in workspace-level conversation and not in this repository, treat that as missing documentation and fix it.
