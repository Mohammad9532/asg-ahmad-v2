# Booking Verification Report (Sprint 2.4)

This document serves to formally prove that the new Laravel Financial Engine calculates booking metrics consistently with the legacy Express system, while documenting any intentional improvements made to correct legacy accounting flaws.

## Scenario 1: Standard Unpaid Booking
**Data**: Booking created for 150 AED, no payments received.

| Metric | Express Output | Laravel Output | Status |
| :--- | :--- | :--- | :--- |
| **Gross** | 150 | 150 | Match |
| **Cancelled** | 0 | 0 | Match |
| **Net** | 150 | 150 | Match |
| **Paid** | 0 | 0 | Match |
| **Pending** | 150 | 150 | Match |
| **Credit** | 0 | 0 | Match |

*Conclusion*: Identical.

## Scenario 2: Partial Payment
**Data**: Booking created for 150 AED, 100 AED payment received.

| Metric | Express Output | Laravel Output | Status |
| :--- | :--- | :--- | :--- |
| **Gross** | 150 | 150 | Match |
| **Cancelled** | 0 | 0 | Match |
| **Net** | 150 | 150 | Match |
| **Paid** | 100 | 100 | Match |
| **Pending** | 50 | 50 | Match |
| **Credit** | 0 | 0 | Match |

*Conclusion*: Identical.

## Scenario 3: Full Payment
**Data**: Booking created for 150 AED, two payments received (100 AED + 50 AED).

| Metric | Express Output | Laravel Output | Status |
| :--- | :--- | :--- | :--- |
| **Gross** | 150 | 150 | Match |
| **Cancelled** | 0 | 0 | Match |
| **Net** | 150 | 150 | Match |
| **Paid** | 150 | 150 | Match |
| **Pending** | 0 | 0 | Match |
| **Credit** | 0 | 0 | Match |

*Conclusion*: Identical.

## Scenario 4: Overpayment
**Data**: Booking created for 150 AED, payment received for 200 AED.

| Metric | Express Output | Laravel Output | Status |
| :--- | :--- | :--- | :--- |
| **Gross** | 150 | 150 | Match |
| **Cancelled** | 0 | 0 | Match |
| **Net** | 150 | 150 | Match |
| **Paid** | 200 | 200 | Match |
| **Pending** | 0 | 0 | Match |
| **Credit** | 50 | 50 | Match |

*Conclusion*: Identical. Express implicitly handled this depending on the frontend renderer, but Laravel strictly enforces the `Credit = Max(0, Paid - Net)` formula natively.

## Scenario 5: Cancelled Before Payment
**Data**: Booking created for 150 AED, cancelled before any payment is made.

| Metric | Express Output | Laravel Output | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Gross** | 150 | 150 | Match | |
| **Cancelled** | 150 | 150 | Match | |
| **Net** | 0 | 0 | Match | |
| **Paid** | 0 | 0 | Match | |
| **Pending** | 150 | 0 | **Intentional Diff** | Express left a phantom debt. |
| **Credit** | 0 | 0 | Match | |

*Intentional Difference Documented*: 
In Express, a cancelled booking often still showed a `Pending` balance of 150 because it was purely `amount - paid`. Laravel strictly adheres to Principle 3 of the `ERP_CONSTITUTION.md`: **Cancelled Creates No Debt**. The pending amount instantly zeroes out.

## Scenario 6: Cancelled After Payment
**Data**: Booking created for 150 AED, customer pays 100 AED. Later, the booking is cancelled.

| Metric | Express Output | Laravel Output | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Gross** | 150 | 150 | Match | |
| **Cancelled** | 150 | 150 | Match | |
| **Net** | 0 | 0 | Match | |
| **Paid** | 100 | 100 | Match | |
| **Pending** | 50 | 0 | **Intentional Diff** | Express left a phantom debt. |
| **Credit** | 0 | 100 | **Intentional Diff** | Laravel explicitly identifies liability. |

*Intentional Difference Documented*:
Express failed to formally decouple the `Paid` cash from the `Pending` debt upon cancellation, leading to confusing accounting states. Laravel zeroes the `Pending` debt (because the customer owes nothing for a cancelled order) and strictly flags the `100` as `Credit` (because the business is holding customer cash for a voided service). 

---

## Final Verdict
The Laravel engine perfectly replicates the standard revenue flows of the Express system while successfully patching the legacy system's critical vulnerabilities regarding phantom debt and unassigned liabilities on cancelled transactions. The Booking engine is fully verified.
