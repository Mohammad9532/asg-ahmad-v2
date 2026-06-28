# Laravel Booking Gap Analysis

This document compares the current state of the Laravel rewrite (`d:\Alresala\server`) against the rules defined in `BOOKING_SPECIFICATION.md`.

---

## Data Fields

* `billNo` (`booking_number`): ✅ **Complete**
* `name` (via `Customer` relation): ✅ **Complete**
* `date` (`booking_date`): ✅ **Complete**
* `countryCode` (via `Customer`): ✅ **Complete**
* `phone` (`mobile` via `Customer`): ✅ **Complete**
* `qty` (`pieces`): ✅ **Complete**
* `amount`: ✅ **Complete**
* `status`: ✅ **Complete**
* `noOfUpdates`: ❌ **Missing**

### Missing: `noOfUpdates`
* **Why it is missing**: The Laravel schema does not include an `update_count` or `no_of_updates` integer column to track edit frequency.
* **Implementation Files**: `database/migrations/*_create_bookings_table.php`, `app/Models/Booking.php`, `app/Services/BookingService.php` (increment logic).
* **Complexity**: Low
* **Dependencies**: None.

---

## Business Rules

### Shop Isolation
⚠️ **Partial**
* **Why it is partial**: `branch_id` is assigned upon creation in `BookingService::create` (`Auth::user()?->branch_id`). However, there is no global scope or `BookingPolicy` enforcing read/update isolation. A user could technically query `/api/bookings` and see bookings from other branches.
* **Implementation Files**: `app/Policies/BookingPolicy.php` (Needs to be created), `app/Providers/AuthServiceProvider.php`.
* **Complexity**: Medium
* **Dependencies**: User roles/branches must be fully implemented.

### Duplicate Rules
⚠️ **Partial**
* **Why it is partial**: Uniqueness is currently global (`'unique:bookings,booking_number'`). The specification requires the `booking_number` to be unique *per shop* (i.e., `Rule::unique('bookings')->where('branch_id', ...)`).
* **Implementation Files**: `app/Http/Requests/StoreBookingRequest.php`, `app/Http/Requests/UpdateBookingRequest.php`.
* **Complexity**: Low
* **Dependencies**: Requires `branch_id` context during validation.

### Number Generation
⚠️ **Partial**
* **Why it is partial**: `BookingController::nextNumber()` correctly finds the highest numeric booking. However, it does not filter by the authenticated user's `branch_id`, leading to incorrect sequence generation across different shops.
* **Implementation Files**: `app/Http/Controllers/Api/BookingController.php`.
* **Complexity**: Low
* **Dependencies**: None.

### Cancellation Rules & Stock Exclusion
❌ **Missing**
* **Why it is missing**: While `BookingController::cancel` exists, the financial aggregations (Gross Booking, Net Booking) that utilize these cancellation rules do not exist yet in the Laravel app.
* **Implementation Files**: `app/Services/BookingCalculationService.php` (Needs creation).
* **Complexity**: High
* **Dependencies**: Dashboard/Reporting endpoints.

---

## Calculations

* **Gross Booking**: ❌ **Missing**
* **Cancelled Booking**: ❌ **Missing**
* **Net Booking**: ❌ **Missing**
* **Pending Stock Amount**: ❌ **Missing**
* **Booking Balance**: ✅ **Complete** (Computed efficiently via `Booking::getPendingAmountAttribute()`).

### Missing: Aggregations (Gross, Net, Pending Stock)
* **Why it is missing**: The `DashboardController` is currently empty. The logic to sum `amount` over date ranges and subtract cancelled bookings is entirely absent.
* **Implementation Files**: `app/Http/Controllers/Api/DashboardController.php`, `app/Services/BookingCalculationService.php`.
* **Complexity**: High
* **Dependencies**: Must accurately match legacy Express mathematical logic to prevent financial reporting discrepancies.

---

## API Endpoints

* `POST /api/bookings`: ✅ **Complete**
* `PUT /api/bookings/{booking}`: ✅ **Complete**
* `GET /api/bookings/number/{bookingNumber}`: ✅ **Complete**
* `GET /api/bookings` (Summarized Aggregations): ⚠️ **Partial** (Lists bookings, but doesn't return summary aggregates).
* `GET /api/bookings/next-number`: ⚠️ **Partial** (Lacks `branch_id` scope).

---

## Recommended Implementation Order

To safely complete the modernization without breaking business rules, implement the missing requirements in this order (Lowest Risk to Highest Risk):

1. **Update Tracking (`noOfUpdates`)**:
   * *Action*: Add `update_count` integer to the database migration. Increment it inside `BookingService::update`.
2. **Duplicate Rules (Shop Scoping)**:
   * *Action*: Refactor `StoreBookingRequest` and `UpdateBookingRequest` to use `Rule::unique('bookings')->where('branch_id', $userBranchId)`.
3. **Number Generation (Shop Scoping)**:
   * *Action*: Add `->where('branch_id', auth()->user()->branch_id)` to the query in `BookingController::nextNumber()`.
4. **Shop Isolation (Policies)**:
   * *Action*: Create `BookingPolicy`. Enforce `viewAny`, `view`, `update`, and `delete` methods to ensure `$user->branch_id === $booking->branch_id`. Register the policy and apply it to the `BookingController`.
5. **Dashboard Aggregations (Gross/Net/Stock)**:
   * *Action*: Re-implement the Express `createSummaryRoute` logic inside a new `BookingCalculationService`. Ensure cancellation statuses are respected when calculating the Net Booking.

---

## Booking Completion %

**Estimated Completion: 70%**

The core architectural foundation is solid. Models, Relationships, Services, and RESTful routing are implemented cleanly. The remaining 30% consists primarily of enforcing the multi-tenant business rules (`branch_id` scoping) and porting the complex financial aggregation algorithms for the dashboard.
