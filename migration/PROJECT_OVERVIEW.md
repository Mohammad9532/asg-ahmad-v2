# Project Overview

This document provides a final summary of the Business Management System's architecture and module inventory following the comprehensive reverse-engineering audit.

## Inventory Totals

* **Total Models**: 6
* **Total Routes**: 7
* **Total Utilities**: 3
* **Total Middleware**: 2
* **Total Frontend Modules**: 24

## System Architecture Highlights
- **Tech Stack:** Node.js/Express backend (MongoDB/Mongoose) with a Vanilla JavaScript frontend.
- **Dynamic Routing:** Backend routes are dynamically generated for shop instances using `SHOP_NAMES` and `routeCreators.js`.
- **Frontend State Management:** Utilizes a global `state` object (`state.js`) where UI components reactively subscribe to state updates.
- **Data Integrity:** Strict role-based access control (RBAC) is enforced in `api/_lib/middleware/auth.js` to isolate shop-specific data.
- **Financial Consistency:** The system relies on centralized `routeCreators.js` for complex financial aggregation and audit logic.
- **Primary Authentication:** `api/_lib/middleware/auth.js`.
- **Navigation:** `client/src/modules/router.js`.

The documentation within the `migration/` directory serves as the definitive reference for the project architecture.
