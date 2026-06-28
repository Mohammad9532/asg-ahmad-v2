# Booking Calculation Specification

This document defines the strict mathematical and financial rules for the `BookingCalculationService`. This service will serve as the pure, stateless financial engine of the Booking module.

## 1. Core Financial Definitions

### Gross Booking
* **Definition**: The absolute sum of all booking `amount` fields, regardless of status.
* **Formula**: `Sum(amount)` for all bookings.

### Cancelled Booking
* **Definition**: The sum of booking `amount` fields where the booking `status` is marked as cancelled.
* **Formula**: `Sum(amount)` where `status == 'cancelled'`.

### Net Booking
* **Definition**: The true, realized revenue metric. 
* **Formula**: `Gross Booking - Cancelled Booking`.

### Paid Amount
* **Definition**: The total money received from the customer for a specific booking.
* **Formula**: `Sum(amount)` of all successful, non-deleted `Payment` records linked to the booking.

### Pending Amount (Outstanding Balance)
* **Definition**: The amount the customer still owes for a specific booking.
* **Formula**: 
  * If `status == 'cancelled'`: **0** (Customer owes nothing for a cancelled order).
  * If `status != 'cancelled'`: `Max(0, Booking Amount - Paid Amount)`.

### Overpayment (Refund Due)
* **Definition**: Occurs when a customer has paid more than the final Net amount of the booking (most commonly due to cancellation after payment).
* **Formula**: `Max(0, Paid Amount - Net Booking Amount)`.

---

## 2. Timing and State Transitions

### A. Booking Created
* **Event**: New booking saved with `amount = 150`.
* **State**:
  * Gross Booking: `+150`
  * Net Booking: `+150`
  * Paid Amount: `0`
  * Pending Amount: `150`

### B. Partial Payment Received
* **Event**: Customer pays `100` against the `150` booking.
* **State**:
  * Gross/Net: Unchanged
  * Paid Amount: `100`
  * Pending Amount: `50`

### C. Booking Cancelled (Before Payment)
* **Event**: Booking is cancelled before any money changes hands.
* **State**:
  * Cancelled Booking: `+150`
  * Net Booking: `-150`
  * Pending Amount: `0` (Zeroed out automatically to prevent phantom debt).

### D. Booking Cancelled (After Payment)
* **Event**: Booking is cancelled after `100` was paid.
* **State**:
  * Cancelled Booking: `+150`
  * Net Booking: `-150`
  * Paid Amount: `100` (Remains! The business still holds the cash).
  * Pending Amount: `0`
  * Overpayment / Refund Due: `100`

---

## 3. Edge Cases & ERP Behaviors

| Scenario | ERP Behavior |
| :--- | :--- |
| **Overpayment** | If a customer pays `200` on a `150` booking, Pending becomes `0` and Overpayment becomes `50`. The `150` booking cannot swallow the extra `50` as revenue. |
| **Reopened Booking** | If a cancelled booking is restored to `booked`, it is subtracted from `Cancelled Booking`, added back to `Net Booking`, and its `Pending Amount` is recalculated based on existing payments. |
| **Deleted Booking** | Deletions (soft or hard) strictly reverse all numbers. It disappears entirely from Gross, Cancelled, and Net calculations. *(Note: Audited ERPs typically forbid deleting financial records; they must be cancelled instead).* |

---

## 4. Express Comparison & Corrections

### How Express Did It:
* Express calculated `Net Booking` on the fly using MongoDB aggregations, successfully subtracting cancelled bookings.
* Express relied heavily on implicit string matching (`billNo`) to calculate balances between bookings and deliveries/payments.
* **Express Flaw**: In Express, if a booking was cancelled *after* being partially paid, the system did not cleanly distinguish between "Pending Debt" and "Refund Liability". It often left phantom balances depending on how the frontend rendered the math.

### The Laravel ERP Correction:
* The new `BookingCalculationService` will strictly enforce the "Zero Pending on Cancel" rule.
* If a booking is cancelled, the customer owes nothing (`Pending = 0`). Any cash already collected instantly becomes a strictly trackable `Refund Due` liability. This prevents cancelled bookings from showing up on "Customer Debt" aging reports.

---

## 5. Architectural Rule: Purity

`BookingCalculationService` must remain a **pure** service.
* **IT MUST**:
  * Take a `Booking` model (and its loaded relations) or an array of Bookings.
  * Return strict numerical values, DTOs, or math arrays.
* **IT MUST NEVER**:
  * Trigger database `update()` calls.
  * Send Emails or SMS.
  * Write to `AuditLog`.
  * Touch `CounterService`.

By keeping this service pure, we can write aggressive, exhaustive Unit Tests that pass hundreds of financial scenarios in milliseconds without touching the database.

---

## 6. Testing Strategy
We will introduce `tests/Unit/BookingCalculationServiceTest.php`. 
Because the service is pure, we will instantiate mock `Booking` and `Payment` objects in memory (using `make()` instead of `create()`) and test every single mathematical edge case (Overpayments, Cancellations, Zero-dollar bookings) instantaneously.
