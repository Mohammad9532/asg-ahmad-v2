# Implementation Roadmap - Version 2

This roadmap provides a week-by-week engineering execution plan for the transition from the legacy MongoDB architecture to the V2 MySQL architecture. It structures the effort to prioritize data integrity, incremental validation, and a zero-risk cutover.

---

## Week 1: Foundation & Migration Framework
**Objective**: Establish the development environment, new database schema, and the foundational migration tooling.
- Initialize the V2 backend repository (or staging environment).
- Write and execute the MySQL DDL scripts to create the target schema (`shops`, `users`, `bookings`, `payments`, etc.) as defined in the Database Design document.
- Build the Node.js migration framework (the script runner that connects to MongoDB as Read-Only and MySQL as Write).
- Implement basic logging and error handling for the migration script.

## Week 2: System Data & Lookup Tables
**Objective**: Migrate all configuration, master data, and global entities.
- Migrate `shops` (hardcode the 9 canonical shops).
- Migrate `payment_methods` (hardcode `CASH`, `ADIB`, `ATM`).
- Migrate `users` and link to `shop_id`.
- Migrate `expense_masters` and `targets`.
- Migrate `ledger_settings`.
- **Validation Checkpoint**: Verify all users can authenticate against the MySQL database and all dropdowns (shops, expenses) populate correctly.

## Week 3: Customers & Bookings (The Core Entities)
**Objective**: Execute the most complex data transformation—extracting customers and migrating bookings.
- Write the data extraction logic to scrub and standardize `countryCode` and `phone`.
- Generate the `customers` table dynamically by grouping legacy bookings by phone number per shop.
- Migrate the massive `[shop]bookings` collections into the unified `bookings` table.
- Standardize the `status` string fields into the strict MySQL ENUM during insertion.
- **Validation Checkpoint**: Ensure the total count of bookings and the Gross Revenue aggregations match perfectly between MongoDB and MySQL.

## Week 4: Payments & Orphans (The Financials)
**Objective**: Elevate deliveries to first-class payments and map relationships.
- Run the migration for `[shop]deliveries` into the `payments` table.
- Implement the in-memory mapping to translate the legacy string `billNo` into the new MySQL `booking_id`.
- Implement the "Orphan Payment" fallback (mapping unlinked payments to `booking_id = NULL` and logging the legacy `billNo`).
- **Validation Checkpoint**: Verify the Total Cash, ADIB, and ATM totals match between systems.

## Week 5: Expenses, Audits & Ledger Adjustments
**Objective**: Migrate the remaining operational tables.
- Migrate `[shop]expenses`, linking them to the `expense_masters` lookup table.
- Migrate `[shop]audit` to `stock_audits`, linking to `booking_id`.
- Migrate `ledger_adjustments`.
- **Validation Checkpoint**: Run the automated validation script across ALL endpoints (Gross, Net, Total Delivery, Total Expenses, and Daily Ledger Closing Balances). They must match to the exact decimal.

## Week 6: Shadow Testing & V2 API Refactoring
**Objective**: Complete the API endpoints and run shadow tests with production data.
- Finish rewriting the REST API endpoints (Controllers/Services) to read from MySQL instead of MongoDB.
- Deploy the V2 backend to a Staging environment.
- Run a full dry-run migration on a recent copy of Production data.
- Have QA/Stakeholders perform UAT (User Acceptance Testing) on the V2 Staging environment to ensure the frontend operates seamlessly with the new backend.
- Optimize any slow MySQL queries or Views.

## Week 7: Production Cutover
**Objective**: Officially launch Version 2.
- **Preparation**: Finalize the rollback plan and communicate the maintenance window.
- **Execution (Maintenance Window)**:
  1. Lock V1 Node.js backend to prevent new writes.
  2. Run the final, official migration script.
  3. Execute the automated validation assertions.
  4. Upon success, swap the DNS/Load Balancer to route traffic to the V2 backend.
- **Post-Launch**: Monitor server logs and database performance closely for 48 hours. Keep the V1 infrastructure running (but inaccessible) as the ultimate fallback.
