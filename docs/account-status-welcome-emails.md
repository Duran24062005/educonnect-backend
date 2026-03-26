# Account Status Welcome Emails

## Summary

EduConnect now sends different welcome email templates depending on whether the account is still inactive/pending or already active.

This behavior lives in the backend and is triggered by the existing auth and admin user-management flows.

## Trigger Rules

- `POST /api/auth/complete-profile`
  Sends `welcome_inactive_count_educonnect.html` after the public registration flow completes the personal profile.
- `POST /api/users/:id/approve`
  Sends `welcome_active_count_educonnect.html` after an admin approves a pending user.
- `PATCH /api/users/:id/status`
  Sends `welcome_active_count_educonnect.html` when a user transitions to `active`.
- `PATCH /api/users/:id/status`
  Sends `welcome_inactive_count_educonnect.html` when a user transitions to `inactive` or `pending`.

No status email is sent if the requested status is the same as the current one.

## Implementation Notes

- Email sending remains best-effort. If the email provider fails, the main business action still succeeds.
- The backend resolves the recipient email from `User.email` and the display name from `Person.first_name`.
- Login emails continue using the existing login template and are not part of this status-based onboarding flow.

## Test Strategy

- API tests use an in-memory email adapter via `globalThis.__EDUCONNECT_EMAIL_SERVICE__`.
- This keeps tests isolated from the external email API while still asserting template names, recipients, and trigger timing.
