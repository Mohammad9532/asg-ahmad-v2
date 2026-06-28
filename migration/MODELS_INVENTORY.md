# Models Inventory

## File Name
`Audit.js`

## Purpose
Defines the schema for stock audit records, capturing missing pieces, balances, and audit status.

## Responsibilities
- Maps stock audit data to MongoDB via Mongoose.
- Stores bill number, quantities, missing pieces, amount balances, and audit remarks.
- Tracks audit status ('Checked' or 'Archived').

## Main Functions
- `AuditSchema`: Mongoose schema definition.

## Imports
- `mongoose`

## Exports
- `AuditSchema`

## Used By
- `api/_lib/routes/shopRoutes.js`

## Depends On
- `mongoose`

## Risk Level
Medium

## Business Importance
Important

---

## File Name
`ExpenseMaster.js`

## Purpose
Defines the schema and model for managing predefined master lists of expense targets (employees or general payees).

## Responsibilities
- Stores master records for expenses to ensure consistent data entry.
- Categorizes expenses into types (employee, general), departments, and categories.

## Main Functions
- `ExpenseMasterSchema`: Mongoose schema definition.
- `ExpenseMaster`: Mongoose model.

## Imports
- `mongoose`

## Exports
- `ExpenseMasterSchema`, `ExpenseMaster`

## Used By
- `api/_lib/routes/masterRoutes.js`

## Depends On
- `mongoose`

## Risk Level
Low

## Business Importance
Important

---

## File Name
`Ledger.js`

## Purpose
Defines schemas for daily ledger settings (initial balances) and daily ledger adjustments (short/extra cash).

## Responsibilities
- Stores initial balance and start date for each shop's daily ledger.
- Stores daily cash adjustments (short/extra) with notes.
- Enforces unique daily adjustments per shop via composite indices.

## Main Functions
- `ledgerSettingsSchema`, `ledgerAdjustmentSchema`: Mongoose schema definitions.
- `LedgerSettings`, `LedgerAdjustment`: Mongoose models.

## Imports
- `mongoose`

## Exports
- `LedgerSettings`, `LedgerAdjustment`

## Used By
- `api/_lib/routes/ledgerRoutes.js`
- `api/_lib/utils/routeCreators.js`

## Depends On
- `mongoose`

## Risk Level
Medium

## Business Importance
Critical

---

## File Name
`Target.js`

## Purpose
Defines the schema for setting monthly financial targets per shop.

## Responsibilities
- Stores monetary target amounts for a specific shop, year, and month.

## Main Functions
- `TargetSchema`: Mongoose schema definition.

## Imports
- `mongoose`

## Exports
- `Target` (Model)

## Used By
- `api/_lib/routes/analyticsRoutes.js`

## Depends On
- `mongoose`

## Risk Level
Low

## Business Importance
Optional

---

## File Name
`Transaction.js`

## Purpose
Defines schemas for the core business transactions: Bookings, Deliveries, and Expenses.

## Responsibilities
- Stores individual order bookings with customer details, quantities, and statuses.
- Stores delivery payments with amounts and payment types.
- Stores operational and employee expenses categorized by department.

## Main Functions
- `BookingSchema`, `DeliverySchema`, `ExpenseSchema`: Mongoose schema definitions.

## Imports
- `mongoose`

## Exports
- `BookingSchema`, `DeliverySchema`, `ExpenseSchema`

## Used By
- `api/_lib/routes/shopRoutes.js`

## Depends On
- `mongoose`

## Risk Level
High

## Business Importance
Critical

---

## File Name
`User.js`

## Purpose
Defines the schema for application user authentication and authorization.

## Responsibilities
- Stores user credentials, roles (admin, shop), and shop associations.
- Provides uniqueness constraint on usernames.

## Main Functions
- `userSchema`: Mongoose schema definition.

## Imports
- `mongoose`

## Exports
- `User` (Model)

## Used By
- `api/_lib/routes/authRoutes.js`

## Depends On
- `mongoose`

## Risk Level
High

## Business Importance
Critical
