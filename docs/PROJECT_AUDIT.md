# Project Architectural Audit
**Project Path:** `D:\asg-ahmad-v2`  
**Application Name:** BeingReal Accounts / Ledger Pro (mongo-bill-api)

---

## 1. Executive Summary
This document provides a comprehensive architectural audit of the active `asg-ahmad-v2` repository. It has been discovered that the previously assumed architecture (Laravel API + React Client) belongs to a different project (`D:\Alresala`). The active ERP project is a monolithic **Node.js (Express) backend** with a **Vanilla JavaScript frontend** connected to **MongoDB**. It is designed to be deployable on serverless environments like Vercel.

---

## 2. Frontend Architecture
* **Framework:** 100% Vanilla JavaScript. There is no modern SPA framework (no React, Vue, or Angular) in use.
* **Styling:** Tailwind CSS (v4) compiled via the Tailwind CLI (`client/css/tailwind-input.css` -> `client/css/main.css`).
* **Routing & UI:** A single-page architecture built around `client/index.html`. Navigation between modules (e.g., Bookings, Delivery, Master Data) is handled via DOM manipulation, hiding/showing sections, and heavy use of Modal dialogs (e.g., `addEntryModal`, `masterDataModal`).
* **State Management:** Handled natively via global variables in JavaScript modules (`client/src/modules/state.js`) and `localStorage`.
* **Libraries:** Uses `Chart.js` for analytics, `SheetJS` for Excel exports, and `html2pdf.js` for reporting.

---

## 3. Backend Architecture
* **Framework:** Node.js (v20.x engine) using Express.js (v5.1.0).
* **Entry Point:** `api/index.js` acts as the master server, managing database connections and mounting modular route files.
* **Hosting Design:** Built to support both local execution (via `npm run start` / `nodemon`) and Vercel Serverless functions (handled via `vercel.json` and specific prefix mounting logic).
* **Authentication:** Custom JWT-based authentication using `jsonwebtoken` and `bcryptjs`.
* **Caching:** In-memory caching utilized via `node-cache` (e.g., `cacheMiddleware(300)`).

---

## 4. API Structure
The API is cleanly separated into modular domain routers located in `api/_lib/routes/`:
* `aiRoutes.js`: Endpoints for the AI Chat interface (utilizing `@google/generative-ai` / Groq).
* `analyticsRoutes.js`: Shop-specific financial computations.
* `authRoutes.js`: Login, logout, and token validation.
* `globalRoutes.js`: Highly complex aggregate queries for compiling metrics across all shops simultaneously.
* `ledgerRoutes.js`: Daily financial adjustments and balances.
* `masterRoutes.js`: CRUD endpoints for Master Data (Employees and General Payees).
* `shopRoutes.js`: Shop-specific dynamic route generation.

---

## 5. Database Access & Schema Design
* **Database Engine:** MongoDB via Mongoose ORM.
* **Multi-Tenant Architecture:** The system employs a "Dynamic Collection" pattern rather than a shared table with a `shop_id`. Schemas defined in `api/_lib/models/Transaction.js` (`BookingSchema`, `DeliverySchema`, `ExpenseSchema`) are dynamically bound to shop-specific collections (e.g., `GaidaBookingsModel`, `SafaDeliveryModel`).
* **Audit Trail:** Dedicated `Audit.js` schema tracks granular changes across the system.

---

## 6. Folder Structure
```text
D:\asg-ahmad-v2\
├── api/                    # Node.js/Express Backend
│   ├── _lib/
│   │   ├── middleware/     # Auth, cache, compression
│   │   ├── models/         # Mongoose Schemas
│   │   ├── routes/         # Domain-specific API controllers
│   │   └── utils/          # Constants, DB helpers
│   └── index.js            # Server entry point
├── client/                 # Vanilla JS Frontend
│   ├── css/                # Tailwind input/output
│   ├── js/                 # Global JS injections
│   ├── src/
│   │   └── modules/        # Modular Vanilla JS logic (render.js, api.js, ui.js)
│   ├── index.html          # Main Dashboard SPA
│   └── login.html          # Auth UI
├── docs/                   # System Documentation
├── migration/              # Planning docs / Old specs
└── scripts/                # Node utility scripts (database patching, migrating)
```

---

## 7. Existing Modules & Current Completion Status
The active project is a highly mature, production-ready system with complex integrations:
1. **Bookings & Deliveries**: Complete. Includes complex matching logic (`compare_bookings.js`, `excess_delivery.js`).
2. **Expense & Ledger Management**: Complete. Tracks daily cash flows (`dailyLedger.js`) and business expenses.
3. **Master Data (Payees/Employees)**: Exists and is actively managed via `master_data.js` and `ExpenseMaster.js`.
4. **Auditing**: Comprehensive real-time auditing and stock discrepancy tracking (`stock_audit.js`).
5. **Analytics Engine**: Robust reporting capable of instant PDF generation and global multi-shop aggregation (`render_tables.js`, `globalRoutes.js`).
6. **AI Assistant**: Deeply integrated conversational AI capable of interacting with the ERP's financial data.

### Conclusion
The codebase in `D:\asg-ahmad-v2` is fundamentally different from a standard Laravel application. It is a highly customized, performance-optimized Vanilla JS and Node.js/MongoDB application relying on dynamic collection binding for multi-tenancy. Any further architectural plans or implementations must strictly conform to this Node/Express + Vanilla JS paradigm.
