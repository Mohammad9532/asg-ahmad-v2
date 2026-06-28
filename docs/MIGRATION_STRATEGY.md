# Migration Strategy - V1 MongoDB to V2 MySQL

This document defines the operational strategy for safely migrating data from the legacy MongoDB architecture to the V2 MySQL architecture. It outlines the step-by-step process, data mapping strategies, validation techniques, and rollback procedures.

---

## 1. Migration Execution Flow

The migration will be executed via a dedicated, single-use Node.js migration script. This script will connect to both the live MongoDB cluster (Read-Only) and the new MySQL database (Write).

### Step 1: Foundation & Lookup Data
- Seed the `shops` table with the 9 canonical shop names.
- Seed the `payment_methods` table (`CASH`, `ADIB`, `ATM`).
- Migrate `users` mapping string `shop` to `shop_id`.
- Migrate `expense_masters`, `ledger_settings`, and `targets`.

### Step 2: The Customers & Bookings Pipeline
**How do we migrate bookings?**
1. Read all bookings from `[shop]bookings` collections.
2. Extract the `phone`, `countryCode`, and `name`. 
3. **Upsert Customers**: For each unique phone number per shop, insert a record into `customers` and return the `customer_id`. (If a phone number is missing, assign to a generic "Walk-in" customer for that shop).
4. **Insert Bookings**: Insert the booking utilizing the newly generated `customer_id`. Standardize the `status` field to lowercase ENUMs during this step.

### Step 3: The Payments & Audits Pipeline
**How do we map `billNo` to `booking_id`?**
- During Step 2, the script will maintain an in-memory dictionary mapping: `Dict[shop_id][billNo] = booking_id`.
- When iterating through `[shop]deliveries` to create `payments`, the script looks up the `booking_id` using the legacy `billNo`.
- The `amountType` regex logic is evaluated one final time to map to a `payment_method_id`.

**What happens to orphan deliveries?**
An "orphan delivery" is a payment record with a `billNo` that does not exist in the Bookings collection. 
- **Action**: The payment will be migrated with `booking_id = NULL` so the cash is not lost from the daily ledger.
- **Traceability**: The legacy `billNo` will be appended to an `orphan_migration_log.txt` file and a "note" column on the payment will be flagged as `[ORPHANED_BILL: 1234]`. This ensures accounting accuracy while preserving the error context.

### Step 4: Expenses & Ledger Adjustments
- Migrate `[shop]expenses`, mapping the legacy string `targetId` to `expense_masters.id`.
- Migrate `ledger_adjustments`.

---

## 2. Validation Strategy

Data integrity is the highest priority. After the migration script completes, we will run an automated validation script.

**How do we validate migrated totals?**
The validation script will execute the exact same mathematical aggregations on both databases and compare the outputs:
1. **Gross Revenue**: SUM(MongoDB Bookings) vs SUM(MySQL Bookings).
2. **Net Revenue**: Compare totals excluding canceled/deducted statuses.
3. **Total Cash vs Bank**: Compare MongoDB's regex aggregated delivery totals against MySQL's `payment_method_id` grouped totals.
4. **Total Expenses**: Compare MongoDB vs MySQL expense sums.
5. **Ledger Integrity**: Generate the Daily Ledger for today's date on both systems and assert that the `closingBalance` matches exactly to the decimal.

If any of these 5 assertions fail, the migration is considered **FAILED**.

---

## 3. Production Cutover & Downtime Management

**How do we switch production with minimal downtime?**
The dataset is relatively small, meaning a full migration can likely be executed in under 5 minutes.
1. **Dry Run**: Run the migration script on a staging MySQL instance during business hours to verify speed and catch edge cases.
2. **Maintenance Mode**: Schedule a 30-minute maintenance window (e.g., 2:00 AM). Block write traffic to the V1 Node.js API.
3. **Execute**: Run the final migration script from Production MongoDB to Production MySQL.
4. **Validate**: Run the automated validation script.
5. **Cutover**: Update the DNS/Load Balancer to point traffic to the new V2 backend.

---

## 4. Rollback Plan

**How do we roll back if something fails?**

The Golden Rule of this migration: **MongoDB is NEVER mutated.**
The migration script connects to MongoDB using a strict Read-Only user.

If the validation script fails, or if a critical bug is discovered in V2 during the first 24 hours:
1. **Immediate Reversal**: Point the DNS/Load Balancer back to the V1 Node.js backend.
2. **No Data Loss**: Because the V1 backend is still fully functional and pointing to MongoDB, shops can immediately resume operations.
3. **Resolution**: The engineering team truncates the MySQL database, fixes the bug in the migration script or V2 logic, and schedules a new cutover window.

*Note: Any data entered into V2 during a failed cutover window would need to be manually backported to MongoDB, which is why the automated validation script (Phase 2) is critical before allowing users onto the V2 system.*
