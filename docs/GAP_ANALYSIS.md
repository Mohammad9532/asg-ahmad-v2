# Gap Analysis Report

## Executive Summary
**Estimated Completion Percentage**: 35%
**Current Project Maturity**: Architectural Foundation / Early Implementation

**High-level observations**:
The system possesses a robust, mathematically sound foundation with the newly integrated `BookingCalculationService`. However, there is a significant gap between the newly codified `PRODUCT_REQUIREMENTS.md` and the existing `Payment`, `Expense`, and `Master Data` implementations. Several modules currently contain boilerplate code or exhibit behaviour that directly conflicts with the ERP Constitution (e.g., rejecting overpayments instead of creating Customer Credit, allowing payment deletion). 

---

## Module Analysis

### Booking
* **Fully Implemented**: Branch isolation, Automatic number generation, Duplicate booking detection (3 levels), Financial summary calculations via pure service, Cancelled bookings creating zero debt.
* **Partially Implemented**: Frontend forms (require wiring for the Level 2 Warning override token).
* **Missing**: Automatic status transition to `Delivered` upon zero pending balance.
* **Conflicts**: None.
* **Estimated Completion**: 85%

### Payment
* **Fully Implemented**: Database schema, basic single-bill payment recording, receipt generation.
* **Partially Implemented**: Frontend Payment Form exists but only supports single-bill entry.
* **Missing**: Multi-bill session support in the API, automated `Customer Credit` generation, automatic recalculation of booking balances upon payment edits.
* **Conflicts**: 
  1. `PaymentController` has a `destroy` method (Rule: Payments cannot be deleted).
  2. `PaymentController` is missing an `update` method (Rule: Payments may be edited).
  3. `PaymentService` throws an exception if amount > pending (Rule: Overpayments create Customer Credit).
* **Estimated Completion**: 40%

### Expense
* **Fully Implemented**: Database schema (`expenses` table with historical snapshot fields).
* **Partially Implemented**: None.
* **Missing**: `ExpenseController` is completely empty. Frontend `ExpensesPage.jsx` is an empty stub. No logic exists to link `ExpenseMaster` to `Expense` auto-population.
* **Conflicts**: None (Not yet implemented).
* **Estimated Completion**: 10%

### Master Data
* **Fully Implemented**: Database schema (`departments`, `expense_categories`, `expense_master`, `employees`).
* **Partially Implemented**: None.
* **Missing**: `ExpenseMasterController` and `EmployeeController` are empty stubs. No frontend screens exist to manage Departments, Categories, or Expense Masters.
* **Conflicts**: None (Not yet implemented).
* **Estimated Completion**: 5%

---

## Security
* **Authentication**: Fully implemented via Laravel Sanctum.
* **Authorization**: Basic role architecture exists, but endpoint-level enforcement for Master Data editing vs. Staff roles is missing.
* **Branch Isolation**: Implemented via global scopes and `branch_id` assignments.
* **Validation**: Implemented effectively in Booking; missing across Expense and Master Data.
* **Audit**: `AuditService` is fully functional but lacks trigger points in Payment Edits, Expenses, and Master Data because those endpoints do not exist yet.

---

## Architecture
**Compliance Violations against ERP_CONSTITUTION.md**:
* **Debt & Balances (Principle 3)**: `PaymentService` blocks overpayments instead of allowing the Pending balance to hit 0 and spilling the rest into Customer Credit.
* **No Mutative Deletions (Principle 6)**: `PaymentController` exposes a `destroy` endpoint which hard-deletes financial records.

---

## Database
Compared against `DATABASE_DESIGN.md` and business rules:
* **Missing Tables/Fields**: None identified for V1.0 scope. The schema is actually ahead of the requirements.
* **Out of Scope Tables**: `deliveries_table` exists in the database. `PRODUCT_REQUIREMENTS.md` explicitly states there is no Delivery module in V1.0 and "Delivered" is just a status. 

---

## API
* **Existing Endpoints**: Auth, Bookings, basic single Payments.
* **Missing Endpoints**: Multi-bill payments, Payment Updates, Expense CRUD, Expense Master CRUD, Department/Category CRUD, Employee CRUD.
* **Unauthorized Endpoints**: `DELETE /api/payments/{payment}`.

---

## Frontend
* **Existing Screens**: Dashboard (stub), Bookings List, Booking Form, Payments List, Payment Form (single-bill).
* **Missing Screens**: Master Data Management (Departments, Categories, Expense Masters, Employees), Expense Entry Form, Expense List.

---

## Business Rules Mismatches
| Implemented Behaviour | Required Behaviour (PRODUCT_REQUIREMENTS.md) |
| :--- | :--- |
| `PaymentService` throws error on overpayment. | BR-105: Overpayments create Customer Credit automatically. |
| `PaymentController` allows deletion. | BR-108: Payments cannot be deleted. |
| Payments API only accepts single bookings. | BR-104 & 7.5: A single payment session may include multiple bills. |
| Delivery controller & table exist. | BR-109: Fully Paid bookings automatically become Delivered. No Delivery module exists. |

---

## Priority Matrix

### Critical (Must be completed before production)
1. Deprecate `DeliveryController` (remove routes and UI, but leave code until V1.0 is stable) to align with V1.0 scope.
2. Fix `PaymentService` to accept overpayments and generate Customer Credit.
3. Remove `destroy` endpoint from `PaymentController`.
4. Build `Master Data` API and Frontend screens (Required before Expenses can be used).
5. Build `Expense` API and Frontend screens.

### High (Required for Version 1.0)
1. Refactor Payment API to accept an array of bills for multi-bill sessions.
2. Implement Payment `update` endpoints and ensure they trigger the pure `BookingCalculationService`.
3. Wire the Level 2 Duplicate Booking warning UI in the React frontend.

### Medium (Improves usability)
1. Improve UI table filtering and sorting across all lists.
2. Implement Staff vs. Admin route authorization guards.

### Low (Future improvements)
1. Implement actual Customer Wallet/Credit ledger tables (currently, credit is dynamically calculated, which is fine for V1.0, but a dedicated ledger will be needed for tracking long-term liabilities).

---

## Final Recommendation

**Estimated Overall Completion**: 35%

**Biggest Risks**: 
The entire Expense tracking workflow cannot be started because the Master Data engine does not exist. Furthermore, the Payment module's current inability to handle overpayments will cause immediate operational friction at the counter.

**Recommended Implementation Order**:

1. **Sprint 1 — Master Data (100%)**: Build completely Departments, Categories, Expense Masters, and Employees. This forms the absolute foundation.
2. **Sprint 2 — Expense (100%)**: Build the Expense entry workflow dependent entirely on the new Master Data classification.
3. **Sprint 3 — Payment (100%)**: Implement multi-bill payments, Customer Credit generation, Payment edits, remove the delete endpoint, and automate the Delivered status.
4. **Sprint 4 — Booking Polish**: Finish the Delivered automation, wire the Duplicate warning UI, and enforce final validation.
