# Booking Duplicate Rules

Before writing any validation logic for Sprint 2.2, we must define what constitutes a "duplicate booking" from a strict business perspective. 

## 1. Express Comparison (The Old System)
In the old Node/Express system, a duplicate was defined purely by the **Bill Number** (`billNo`).
Because users either typed the bill number manually or the frontend submitted a previewed number, an accidental double-click would send the exact same `billNo` twice. The database would reject the second request, effectively preventing duplicates.

**The Problem:** 
In Sprint 2.1, we implemented atomic, server-side auto-generation for booking numbers. If a user accidentally double-clicks "Save" today, the backend will assign `BK-000001` to the first click and `BK-000002` to the second click. Both will save successfully. The customer is now double-billed.

Therefore, we can no longer rely on the `booking_number` to catch duplicates. We must validate the **business data**.

## 2. What is a Duplicate?
A booking is considered a duplicate if it represents the **exact same customer transaction** entered more than once by mistake. 

To safely identify a duplicate without blocking legitimate repeat business, it must match **ALL** of the following criteria within the same branch:
1. **Same Customer**: The same `customer_id`.
2. **Same Date**: The same `booking_date`.
3. **Same Value**: The exact same `amount` and `pieces`.
4. **Time Proximity (Optional but recommended)**: Created within a short time window (e.g., the last 5-10 minutes) by the same user.

If a customer genuinely comes in twice on the same day to order the exact same number of pieces for the exact same amount, that is highly irregular but possible. 

## 3. Why?
* **Financial Accuracy**: Duplicate bookings artificially inflate Gross and Net Revenue, leading to incorrect accounting and reporting.
* **Customer Trust**: If a customer receives two SMS receipts or is charged twice for pending balances because of a staff double-click, it damages business credibility.
* **Stock/Tailoring Audits**: The tailors would receive duplicate tickets to manufacture the same garments, wasting materials and labor.

## 4. How Should the ERP Behave?
When a duplicate is detected during a `POST` request (creation):
1. **Intercept**: The request must be caught *before* hitting the `CounterService` or creating a database transaction.
2. **Reject**: The server must return a `422 Unprocessable Entity` or `409 Conflict`.
3. **Inform**: The error message must be human-readable, e.g., *"A booking for this customer with the same amount was already created today. Please verify if this is intentional."*

## 5. Edge Cases
* **Intentional Identical Orders**: A customer might order uniforms for twins on the same day. If they strictly want two separate receipts, the system currently blocks them. 
  * *Solution*: Add a `force_duplicate=true` flag in the payload that the frontend can send if the user explicitly confirms a warning prompt.
* **Cancelled Bookings**: If the original booking was marked as `cancelled`, a new booking with the same data should **NOT** be considered a duplicate. The staff is likely recreating it to fix a mistake.
* **Different Branches**: If the same customer visits Branch A and Branch B on the same day and spends the same amount, these are independent transactions and should not trigger duplicate warnings. (Rule: Duplicates are strictly scoped to `branch_id`).
