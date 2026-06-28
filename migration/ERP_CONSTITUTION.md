# ERP Constitution

This document serves as the absolute source of truth for all architecture, financial operations, calculations, and state transitions across the entire ERP ecosystem (Bookings, Deliveries, Payments, Expenses, Payroll, etc.).

## 1. Storage & Precision
* **Base Units**: All monetary values are strictly stored as integers in the smallest currency unit (e.g., Fils or Cents). A value of `100.50 AED` is stored as `10050`.
* **No Floats**: Floating-point mathematics (`float` or `double`) must never be used for financial storage or intermediate calculations to prevent rounding precision errors.
* **Database Agnostic Currency**: Currency formatting (e.g., `AED`, `$`) is strictly a presentation layer concern. The database and backend APIs only traffic in integers.

## 2. Purity of Calculation Services
* **Pure Calculators**: Financial calculation services (e.g., `BookingCalculationService`, `ExpenseCalculationService`) must be functionally pure.
* **No Side Effects**: They take in Models or DTOs and return strict mathematical summaries. They must NEVER write to the database, fire events, dispatch jobs, or create audit logs.
* **Single Source of Truth**: Dashboards, Analytics, Customer Ledgers, and API Responses must NEVER calculate financial totals independently. They must exclusively call the relevant Calculation Service to ensure 100% mathematical consistency across the entire ERP.

## 3. Debt & Balances
* **Pending is Never Negative**: A customer's "Pending Balance" for a specific transaction can never drop below zero. If they overpay, the Pending Balance is `0`, and the excess spills over into a `Credit` or `Wallet` balance.
* **Cancelled Creates No Debt**: If a transaction (like a Booking or Invoice) is cancelled, the customer owes nothing for it. The `Pending Balance` instantly becomes `0`.
* **Liabilities**: Money collected against a cancelled transaction is a liability, not revenue. The Calculation Service identifies this as `Credit`, which is later routed by business policy (Refund, Wallet, Store Credit) via orchestration services.

## 4. Revenue & Credits
* **Customer Credit is Not Revenue**: If a customer deposits money into their wallet, or overpays an invoice, that money is held as a liability. It only becomes realized revenue when strictly applied against an active, non-cancelled invoice or booking.
* **Gross vs. Net**: 
  * `Gross` represents the absolute total value of the transactions before any deductions, cancellations, or refunds.
  * `Cancelled` represents the sum of voided transactions.
  * `Net` represents actual realized revenue (`Gross - Cancelled`).

## 5. Extensibility & Taxation
* **Tax Preparedness**: All financial objects must reserve namespace for taxation, even if the current tax rate is 0%.
* **Standard Triplets**: Calculation summaries must naturally support `before_tax`, `tax_amount`, and `after_tax` (e.g., `gross_before_tax`, `tax`, `gross_after_tax`).

## 6. Architecture & Orchestration
* **Services Own Logic**: Business rules (e.g., how to handle an overpayment, when to trigger a refund) live in orchestrated Services (e.g., `PaymentService`, `RefundService`).
* **Controllers Orchestrate**: Controllers must remain extremely thin. They authorize requests, validate inputs, pass data to Services, and return formatted API Resources. Controllers do no math and make no business decisions.
* **No Mutative Deletions**: Financial records (Invoices, Bookings, Payments) are historically immutable. To reverse a transaction, it must be `cancelled` or offset with a negative entry. Hard deletions are forbidden.

## 7. Auditability
* Every financial state transition must be strictly explainable.
* At any point in time, the ERP must be able to answer:
  * Why does this customer owe 250 AED?
  * Why is revenue 1,253,450 AED?
  * Why did this booking become cancelled?
* Every financial number must be traceable back to one or more immutable business events.
* **Flow**: `Number` -> `Calculation` -> `Transaction` -> `Audit` -> `User`.

## 8. Deterministic Calculations
* Financial calculations must be mathematically deterministic.
* The same input data must always produce the exact same output.
* Calculation Services must NEVER depend on:
  * Current Time
  * Random Values
  * HTTP Requests
  * Session State
  * Cache
  * External APIs

## 9. Idempotency
* Every financial operation should be idempotent where possible.
* If a network timeout occurs and a client retries a request (e.g., Receive Payment, Cancel Booking, Refund, Wallet Credit), the same request repeated must NOT accidentally create duplicate financial effects.
* Example: "Pay 100 AED on Booking BK-001 with Transaction ID 123" must result in exactly 100 AED collected, no matter how many times it is submitted.

## 10. Event First
* State changes are consequences of events. 
* Event Flow: `Booking Created` -> `Payment Received` -> `Booking Cancelled` -> `Refund Issued`.
* Anti-pattern: "Update pending -> Update revenue -> Update dashboard".
* Correct pattern: `Event` -> `Calculation` -> `Read Models`.
* This ensures the system remains strictly auditable and mathematically sound.
