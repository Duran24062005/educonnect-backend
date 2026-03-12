# EduConnect Backend

EduConnect backend is a Node.js + Express API for academic management: users, students, teachers, subjects, grades, periods, enrollments, and academic reports.

## Tech Stack

- Node.js 20
- Express 5
- MongoDB + Mongoose
- JWT authentication
- Zod validation
- Swagger (OpenAPI) docs
- Jest + Supertest
- Docker + Docker Compose

## Project Architecture

The codebase follows a layered architecture:

`routes -> controllers -> services -> repositories -> models`

Current structure:

```text
src/
  app.js
  config/
  controllers/
  docs/
  middlewares/
  models/
  repositories/
  routes/
  services/
  utils/
  validators/
tests/
scripts/
```

Responsibilities:

- controllers: HTTP request/response handling
- services: business rules and orchestration
- repositories: DB access
- validators: input schemas
- middlewares: auth, authorization, validation, error handling

## Installation

```bash
yarn install
cp .env.example .env
```

## Environment Variables

Required variables are documented in `.env.example`:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `EMAIL_API_BASE_URL`

## Run Locally

```bash
yarn dev
```

Production mode:

```bash
yarn start
```

## Docker Setup

```bash
docker compose up --build
```

Services:

- `backend` on `http://localhost:8000`
- `mongodb` on `localhost:27017`

## API Documentation

Swagger UI is available at:

- `http://localhost:8000/api-docs`

Performance-oriented aggregated endpoints added in this phase:

- `GET /api/analytics/admin/dashboard-summary`
- `GET /api/analytics/teacher/me/dashboard-summary`
- `GET /api/groups/:group_id/detail-summary`

These endpoints are intended to reduce frontend request waterfalls in dashboards and group detail screens.

## Seeding Example Data

```bash
yarn seed
```

This creates sample:

- teachers
- students
- subjects (stored as academic areas)

## Testing

```bash
yarn test
```

Included integration tests cover:

- authentication flow
- create student flow
- list students
- validation/error cases
- aggregated performance summary endpoints

## Security and Production Notes

- Use a strong `JWT_SECRET` in production.
- Restrict `CORS_ORIGIN` to trusted domains.
- Use managed MongoDB backups and monitoring.
- Add rate limiting and request logging for production traffic.
