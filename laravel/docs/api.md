# ASG ERP V2 - API Documentation

## 1. Authentication
- `POST /api/auth/login`: Accepts `email`, `password`. Returns Bearer Token.
- `POST /api/auth/logout`: Revokes token.
- `GET /api/auth/me`: Returns active user profile.

## 2. Headers
All requests must include:
- `Accept: application/json`
- `Authorization: Bearer {token}`

## 3. Reports Engine Endpoints
All reporting endpoints support common filters (`shop_id`, `start_date`, `end_date`, `export`).
- `GET /api/reports/dashboard`: Core metrics (cached).
- `GET /api/reports/cash-book`: Calculates running balances.
- `GET /api/reports/outstanding`: Includes dynamic DB-level ageing (`0-7`, `8-30` days).

## 4. Notification Endpoints
- `GET /api/notifications/count`: High-performance unread count.
- `GET /api/notifications/unread`: Top 10 unread items.
- `POST /api/notifications/read-all`: Mark all as read.
- `POST /api/notifications/{id}/archive`: Soft-removes notification from active feeds.

## 5. System Health
- `GET /api/system/health`: Returns basic `{"status": "ok"}`.
- `GET /api/system/diagnostics`: **(Super Admin Only)** Returns detailed disk, queue, cache, and PHP version telemetry.

## 6. Database Backups
- `GET /api/backups`: Lists historical backups.
- `POST /api/backups`: Triggers a manual backup job.
- `POST /api/backups/{id}/restore-request`: Requests a secure token.
- `POST /api/backups/{id}/restore`: Executes restore using the requested token.
