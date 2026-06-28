# Utilities Inventory

## File Name
`constants.js`

## Purpose
Stores global constants and configuration arrays used across the backend.

## Responsibilities
- Defines the authoritative list of active shops.
- Defines core data types and their collection suffixes (bookings, delivery, expense).

## Main Functions
- N/A (Static declarations)

## Imports
- None

## Exports
- `SHOP_NAMES`, `DATA_TYPES_CONFIG`

## Used By
- `api/_lib/routes/globalRoutes.js`
- `api/_lib/routes/shopRoutes.js`

## Depends On
- None

## Risk Level
Low

## Business Importance
Critical

---

## File Name
`helpers.js`

## Purpose
Provides reusable helper functions, primarily for database queries.

## Responsibilities
- Generates standard MongoDB aggregation pipelines for daily or monthly summaries.
- Handles date matching and conditional sums (e.g., separating canceled amounts).

## Main Functions
- `createAggregationPipeline`: Returns an array of aggregation stages.

## Imports
- None

## Exports
- `createAggregationPipeline`

## Used By
- `api/_lib/utils/routeCreators.js`

## Depends On
- None

## Risk Level
Medium

## Business Importance
Important

---

## File Name
`routeCreators.js`

## Purpose
A factory module containing functions that dynamically generate Express route handler functions.

## Responsibilities
- Encapsulates the business logic for standard CRUD endpoints.
- Implements specialized aggregation logic (accruals, ledger history, daily ledger, lifetime summary, stock audit).
- Prevents code duplication in `shopRoutes.js`.

## Main Functions
- `createEntryRoute`, `updateEntryRoute`: Standard create/update.
- `createSummaryRoute`: Standard summary aggregation.
- `createAccrualSummaryRoute`, `createLifetimeSummaryRoute`, `createDailyLedgerRoute`: Financial metrics.
- `createStockAuditRoute`, `createAuditVerifyRoute`, `createAuditArchiveRoute`, etc.: Audit handling.

## Imports
- `mongoose`, `./helpers`, `../models/Ledger`

## Exports
- Multiple route generator functions (`createEntryRoute`, `updateEntryRoute`, etc.)

## Used By
- `api/_lib/routes/shopRoutes.js`

## Depends On
- `mongoose`

## Risk Level
High

## Business Importance
Critical
