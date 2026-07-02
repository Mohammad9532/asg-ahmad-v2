# ASG ERP V2 - Architecture Overview

## 1. System Overview
ASG ERP V2 is a robust, modular, and high-performance backend built on Laravel 12. It serves as the central source of truth for business operations, financial tracking (Ledger), and user management across multiple shops.

## 2. Core Modules
- **Authentication & RBAC:** Built on Laravel Sanctum. Uses a flattened Role model (`role_id`, `shop_id`) to enforce strict permissions globally and locally without complex pivot tables.
- **Business Operations:** Handles Bookings, Deliveries, and Payments.
- **Ledger Engine:** The single source of truth for all financial movements. Transactions are double-entry mapped automatically via Observers.
- **Settings Module:** Centralized, highly-cached configuration system supporting dynamic types and encryption.
- **Notification Engine:** Event-driven, broadcast-ready engine tracking system state changes with automatic expiry.
- **Reports Engine:** Read-only, SQL-optimized aggregation engine preventing PHP memory exhaustion.

## 3. Design Patterns
- **Fat Services, Thin Controllers:** Business logic resides in `App\Services\`. Controllers strictly handle HTTP routing and Data Transfer Objects (DTOs).
- **Observer Pattern:** Operations automatically sync to the Ledger and dispatch Notifications via Eloquent Observers (`BookingObserver`, `PaymentObserver`, etc.), preventing decoupled transaction failures.
- **DTOs:** `ReportFilterDTO` and other request mappers ensure services remain testable and request-agnostic.
- **Local Scopes:** Avoiding global scopes, the `HasShopAccessScope` provides `->forCurrentUser()` to apply strict multitenancy constraints explicitly on every controller query.

## 4. Caching Strategy
- `app_settings`: Caches the entire settings array indefinitely until a Setting is updated.
- `dashboard_summary`: Caches the heavy dashboard payload for 60 seconds per user scope to support high concurrent access.
