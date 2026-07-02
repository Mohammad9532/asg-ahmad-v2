# ASG ERP V2 - Database Architecture

## 1. Relational Model
The database is strictly relational (MariaDB/MySQL) with enforced foreign key constraints to prevent orphaned records.

## 2. Key Tables
- `users`: Core identity table. Links to `role_id` and `shop_id`.
- `shops`: Multitenancy separator.
- `bookings`, `payments`, `deliveries`, `expenses`: Operational entities.
- `ledgers`: The immutable financial truth. Every operational action (Payment, Expense) writes an atomic record here.
- `settings`: Key-value store featuring dynamic `type` casting and encryption.
- `notifications`: Tracks state changes. Supports polymorphic references (`reference_type`, `reference_id`) and `expires_at` auto-cleanup.
- `activity_logs`: Audits user actions.
- `backup_histories`: Tracks system backup success/failures.

## 3. Immutability
- Financial records (`payments`, `expenses`, `ledgers`) are strictly prohibited from being `updated` or `deleted` once recorded. Reversing transactions must be used instead.
- This is enforced via Eloquent Observers blocking the `updating` and `deleting` hooks with a `ValidationException`.

## 4. Indexing Strategy
To support the high-performance Reports Engine, the following indexes are strictly maintained:
- Foreign keys (`shop_id`, `user_id`, `booking_id`).
- Polymorphic combinations (`reference_type`, `reference_id`).
- Date columns (`booking_date`, `payment_date`, `created_at`).
- Status flags (`is_read`, `is_archived`).
