# Booking Specification

## Purpose
The Booking module is the core revenue-tracking entity of the Business Management System. It records customer orders (bookings), including the total amount due, quantities ordered, and customer contact information. It serves as the foundation for calculating shop performance, stock availability, and outstanding balances.

---

## Complete Workflow
1. **Initiation**: The user selects a specific shop context and opens the "Add Booking" interface.
2. **Bill Number Generation**: The user can manually enter a Bill Number or request the system to auto-generate the next sequential number based on the most recent booking in that shop.
3. **Data Entry**: The user inputs the date, customer name, contact details (country code, phone), quantity, total amount, and an optional status.
4. **Validation**: The system checks if the date and amount are provided. It then checks the database to ensure the provided Bill Number is unique within the context of the selected shop.
5. **Persistence**: The booking is saved to the database.
6. **UI Update**: The frontend receives the success response, triggers a background fetch to refresh the cached data (`state.allResults`), and automatically re-renders the dashboard and tables to reflect the new Net Booking and Stock totals.

---

## Data Fields

| Name | Data Type | Required? | Default | Validation | Business Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `billNo` | String | No | None | Must be unique per shop. | The invoice/receipt number given to the customer. Sometimes 'other-amounts' is used for non-standard entries. |
| `name` | String | No | None | None | Customer's full name. |
| `date` | Date | Yes | None | Must be a valid Date object. | The date the booking/order was placed. |
| `countryCode` | String | No | None | None | Customer's phone country code (e.g., +971). |
| `phone` | String | No | None | None | Customer's mobile number. Used to aggregate customer purchase history. |
| `qty` | Number | No | None | Numeric | Number of items/pieces ordered. |
| `amount` | Number | Yes | None | Must be provided (0 is technically allowed). | The total monetary value of the booking. |
| `status` | String | No | None | Lowercased on save. | Tracks cancellations or adjustments (e.g., "cancel", "deducted"). |
| `noOfUpdates` | Number | Yes | 0 | Auto-incremented. | Audit trail field tracking how many times the record was modified. |

---

## Business Rules

* **Shop Isolation**: Bookings belong strictly to the shop they were created under. A `billNo` "1001" can exist in Shop A and Shop B simultaneously, but never twice in Shop A.
* **Duplicate Rules**: Upon creating or updating a booking, the system actively queries for an existing `billNo`. If a duplicate is found, the transaction is rejected with a `400 Bad Request`.
* **Number Generation**: The system retrieves the latest booking by `date` (descending) and parses the numeric portion of its `billNo`. It increments this number by 1 to suggest the next `billNo`.
* **Cancellation Rules**: If a booking's `status` is set to `"cancel"`, `"canceled"`, `"cancelled"`, or `"deducted"`, its amount is entirely excluded from the "Net Booking" calculations.
* **Stock Exclusion**: Cancelled bookings are completely ignored when calculating pending stock audits (i.e., you do not need to deliver physical stock for a cancelled booking).
* **Update Tracking**: Every time a `PUT` request is made, `noOfUpdates` is incremented by 1.
* **Nullification**: If the frontend explicitly sends empty strings for optional fields during an update, the backend maps them to `null` or empty strings to clear the data from the database.

---

## Calculations

* **Gross Booking**: The absolute sum of all booking `amount` fields within a given period.
* **Cancelled Booking**: The sum of `amount` fields where the `status` matches one of the cancellation keywords.
* **Net Booking**: `Gross Booking` - `Cancelled Booking`. (This is the actual revenue metric used everywhere).
* **Booking Balance**: `Booking Amount` - `Sum of Deliveries matching the same billNo`.
* **Pending Stock Amount**: Evaluated by looking at Net Bookings that have *not* been verified in a Stock Audit. Formula: `Booking Amount` - `Sum of Deliveries matching the same billNo` (only for bills with a balance > 0).

---

## API Endpoints

* `POST /api/:shopName/bookings` — Create a new booking entry.
* `PUT /api/:shopName/bookings/:id` — Update an existing booking entry.
* `GET /api/:shopName/bookings` — Retrieve a summarized aggregation (Gross, Cancel, Net) of bookings for a date range.
* `GET /api/:shopName/bookings/latest-bill` — Fetch the most recently used bill number and calculate the next sequential suggestion.
* `GET /api/:shopName/bill_details?billNo=XYZ` — Fetch the specific booking, plus all its associated deliveries and stock audit histories.

---

## Database

* **Collections**: Stored in dynamically resolved collections based on the shop prefix (e.g., `naseem_transactions` or generic `Transaction` model if prefix is handled at the DB connection level).
* **Relationships**: 
  - Implicit 1-to-Many relationship with **Deliveries** (joined by `billNo`).
  - Implicit 1-to-Many relationship with **Audits** (joined by `billNo`).
* **Indexes**: Indexed heavily on `date` (for date range aggregations) and `billNo` (for duplicate checking and delivery joining).
* **References**: No strict MongoDB `ObjectId` references are used between Bookings and Deliveries; they are loosely coupled via the `billNo` string.

---

## Frontend Flow

**User Action** → Clicks "Save" on the Add Booking form.
↓
**API** → `api.js` intercepts and formats the payload.
↓
**Backend** → `POST /api/:shopName/bookings` receives data, strips empty fields, validates duplicate `billNo`.
↓
**Database** → Mongoose saves the document to the specific shop's collection.
↓
**Response** → Backend returns `201 Created` with the saved document.
↓
**UI Update** → The modal closes. `fetchAllData()` is triggered in the background. The `state.allResults` cache is updated. The observer pattern re-triggers `renderContent()`, updating the Dashboard metrics and the Bookings Data Table instantly.

---

## Dependencies

* **Models**: `api/_lib/models/Transaction.js` (BookingSchema).
* **Routes / Controllers**: `api/_lib/utils/routeCreators.js` (Handles creation, update, duplicate checks, and aggregations).
* **Frontend Modules**: 
  - `add_entry.js` / `edit_entry.js` (Form handling)
  - `render_tables.js` (Table display)
  - `render.js` (Dashboard metric display)
  - `compare_bookings.js` (Analytics)
  - `customers.js` (Aggregates booking data by phone number)
* **Middleware**: `auth.js` (Ensures the user has the role to write to this shop).

---

## Edge Cases
* **Non-Standard Bill Numbers**: Some entries use `billNo: 'other-amounts'`. The system explicitly bypasses duplicate checks and excludes these from standard billing queries.
* **Alphanumeric Bill Numbers**: If a bill is `INV-001`, the `latest-bill` generator attempts to parse `INV-` and `001` separately to suggest `INV-002`.
* **Missing Dates**: The system rejects any booking without an explicit date.
* **Zero Amounts**: A booking with an amount of `0` is technically allowed and saved.

---

## Risks
* **Loosely Coupled Relationships**: Because Deliveries and Audits are tied to Bookings via a plain text `billNo` string rather than a strict ID, altering a `billNo` in an update request without cascading that update to Deliveries/Audits will result in orphaned payments and broken balances.
* **Shop Prefixing**: If the shop context is lost or spoofed in the frontend payload without strict backend RBAC validation, a booking could be saved to the wrong ledger.
* **Calculated Fields**: Net Booking is not stored; it is calculated on the fly. Re-implementing the cancellation status check incorrectly will cause severe revenue discrepancies.

---

## Laravel Mapping

To rebuild this in a modern Laravel architecture, the following structure is recommended to replace the dynamic routing and monolithic architecture:

* **Migration**: 
  - `create_bookings_table`: Add a `shop_id` foreign key (to replace dynamic collections).
  - Columns: `id`, `shop_id`, `bill_no`, `name`, `date`, `country_code`, `phone`, `qty`, `amount` (decimal), `status`, `update_count`.
* **Model**: 
  - `Booking`: Includes relationships `public function shop()`, `public function deliveries()`, `public function audits()`.
* **Service**: 
  - `BookingService`: Contains `createBooking()`, `updateBooking()`, and `generateNextBillNo()`.
  - `BookingCalculationService`: Handles the Gross/Cancel/Net math across date ranges to keep controllers thin.
* **Controller**: 
  - `BookingController`: Standard `index`, `store`, `show`, `update`, `destroy` methods.
* **Request**: 
  - `StoreBookingRequest`: Enforces `date`, `amount`, and unique `bill_no` scoped to the `shop_id` (`Rule::unique('bookings')->where('shop_id', $this->shop_id)`).
* **Resource**: 
  - `BookingResource`: Formats JSON responses (e.g., standardizing date formats, appending calculated balances).
* **Policy**: 
  - `BookingPolicy`: Enforces that `$user->shop_id === $booking->shop_id` (or user is admin) for all actions, replacing the Express middleware role checks.
* **Events**:
  - `BookingUpdated`: To listen for `bill_no` changes and cascade updates to `Deliveries` if the business decides to strictly enforce that relationship in the future.
