# Product Requirements

## Table of Contents

# PRODUCT_REQUIREMENTS.md

# Product Requirements Specification (PRS)

**Project:** Business Management ERP
**Version:** 1.0
**Status:** Draft
**Document Owner:** Product & Architecture Team

---

# Table of Contents

1. Introduction
2. Product Vision
3. Business Objectives
4. User Roles
5. Navigation
6. Booking Module
7. Payment Module
8. Expense Module
9. Master Data
10. Financial Rules
11. Validation Rules
12. Audit Rules
13. Status Definitions
14. User Interface Standards
15. Future Modules
16. Out of Scope
17. Glossary
18. Version History

---

# 1. Introduction

## Purpose

This document defines the functional requirements of the ERP system.

It serves as the official source of truth for all business requirements.

Every feature implemented in the ERP must comply with this document.

If implementation and documentation conflict, this document takes precedence.

---

## Product Summary

The ERP is designed to manage the daily operations of service and retail businesses through a fast, reliable and financially accurate workflow.

Version 1.0 focuses on four operational areas:

* Booking Management
* Payment Management
* Expense Management
* Master Data Management

---

## Scope

Version 1.0 includes:

* Booking
* Payment
* Expense
* Master Data

Version 1.0 does NOT include:

* Inventory
* Purchase
* Supplier Management
* Payroll
* Reports
* Dashboard
* CRM

Those modules will be introduced in future versions.

---

# 2. Product Vision

## Vision Statement

Build an ERP that combines the simplicity of a small business application with the financial integrity of enterprise software.

The system must remain fast for daily operators while enforcing strict business rules behind the scenes.

---

## Problems Solved

The ERP aims to solve the following problems:

* Manual calculation errors.
* Duplicate business records.
* Incorrect outstanding balances.
* Inconsistent business data.
* Missing audit trails.
* Slow data entry.
* Difficult system expansion.

---

## Design Philosophy

The ERP follows these principles:

* Simplicity
* Speed
* Financial Accuracy
* Auditability
* Scalability
* Maintainability

---

## Target Industries

Version 1.0 is suitable for:

* Tailoring
* Laundry
* Repair Centers
* Service Businesses
* Retail Shops
* Small Multi-Branch Businesses

---

## Success Criteria

The ERP is considered successful when it enables businesses to:

* Create bookings quickly.
* Receive payments accurately.
* Record expenses consistently.
* Eliminate manual calculations.
* Produce reliable financial data.
* Expand without redesigning the core system.

---

# 3. Business Objectives

The primary objectives are:

## BO-01

Reduce manual bookkeeping.

---

## BO-02

Provide one central system for all business operations.

---

## BO-03

Guarantee financial correctness.

---

## BO-04

Prevent duplicate data entry.

---

## BO-05

Minimize staff training through a simple user interface.

---

## BO-06

Support future expansion without major architectural changes.

---

# 4. User Roles

Version 1.0 defines two user roles.

## Administrator

Can:

* Manage Bookings
* Manage Payments
* Manage Expenses
* Manage Master Data
* Manage Users
* Edit Records
* Delete Expenses
* View Reports
* Configure System

---

## Staff

Can:

* Create Bookings
* Receive Payments
* Enter Expenses
* View Records

Cannot:

* Manage System Settings
* Delete Protected Records
* Modify Master Configuration

---

# 5. Navigation

The application sidebar contains:

```
Dashboard

Booking

Payment

Expense

Master Data
```

Selecting **Master Data** opens:

```
Departments

Categories

Expense Masters

Employees
```

Navigation must remain simple.

Deep menu nesting is not permitted in Version 1.0.

---

# General User Interface Rules

All modules must follow these principles:

* Fast keyboard entry.
* Minimal clicks.
* Consistent layout.
* Immediate validation.
* Clear error messages.
* Responsive interface.
* No unnecessary popups.
* Automatic calculations wherever possible.

---

# Common Form Behaviour

Every data-entry screen must:

* Default Date to today.
* Allow editing of the date.
* Save without page refresh.
* Show success notification.
* Clear the form after successful save.
* Return cursor to the first input field.
* Preserve consistency across Booking, Payment and Expense screens.

# 6. Booking Module

---

# 6.1 Purpose

The Booking module is the starting point of every business transaction.

A booking records the customer's order and creates the financial obligation that is later settled through the Payment module.

Every booking must belong to exactly one customer and one branch.

---

# 6.2 Booking Information

Each booking contains:

| Field         | Required  |
| ------------- | --------- |
| Booking Date  | Yes       |
| Delivery Date | Yes       |
| Customer Name | Yes       |
| Mobile Number | Yes       |
| Country Code  | Yes       |
| Pieces        | Yes       |
| Amount        | Yes       |
| Status        | Automatic |

---

# 6.3 Customer

Customers are created automatically.

When entering a mobile number:

* Existing customer → Reuse existing customer.
* New customer → Create automatically.

Duplicate customer records should be avoided whenever possible.

---

# 6.4 Booking Number

Booking numbers are:

* Numeric only.
* Generated automatically.
* Unique within each branch.
* Assigned only when the booking is saved.

Example:

```text
1001
1002
1003
```

The booking number displayed before saving is informational only.

The saved booking number is always generated by the server.

---

# 6.5 Booking Status

A booking can have the following statuses:

| Status    | Description               |
| --------- | ------------------------- |
| Pending   | Payment still outstanding |
| Delivered | Pending amount is zero    |
| Cancelled | Booking cancelled         |
Partially Paid
Status changes automatically based on business rules.

Users cannot manually set the Delivered status.

---

# 6.6 Booking Creation Workflow

User enters:

* Booking Date
* Delivery Date
* Customer
* Mobile Number
* Pieces
* Amount

↓

Validation

↓

Duplicate Detection

↓

Booking Number Generated

↓

Booking Saved

↓

Booking appears in Booking List

---

# 6.7 Booking List

Booking List displays:

| Column   |
| -------- |
| Date     |
| Bill No  |
| Customer |
| Mobile   |
| Pieces   |
| Amount   |
| Paid     |
| Pending  |
| Status   |

The list supports:

* Search
* Filtering
* Sorting

---

# 6.8 Editing Bookings

Users may edit bookings.

Allowed edits:

* Delivery Date
* Customer Name
* Mobile Number
* Pieces
* Amount

Booking Number can never be changed.

Every modification must be recorded in the Audit Log.

---

# 6.9 Cancelling Bookings

Bookings may be cancelled.

Cancelled bookings:

* Cannot create customer debt.
* Cannot contribute to net revenue.
* Remain visible in history.
* Preserve all audit records.

Cancellation never deletes the booking.

---

# 6.10 Duplicate Detection

The system must detect duplicate bookings.

Three levels are defined.

## Level 1

Exact duplicate.

Automatically rejected.

---

## Level 2

Possible duplicate.

User receives a warning.

Override confirmation required.

---

## Level 3

Confirmed intentional duplicate.

Booking is allowed.

Override action must be recorded in the Audit Log.

---

# 6.11 Financial Behaviour

Creating a booking creates a financial obligation.

The Booking module itself never records payments.

Payments are handled exclusively by the Payment module.

Booking balances are always calculated through the BookingCalculationService.

Controllers must never calculate balances directly.

---

# 6.12 Business Rules

BR-001

Booking Number is generated automatically.

---

BR-002

Booking Number is numeric only.

---

BR-003

Booking Number cannot be edited.

---

BR-004

Every booking belongs to one branch.

---

BR-005

Every booking belongs to one customer.

---

BR-006

Duplicate bookings are validated before saving.

---

BR-007

Cancelled bookings never produce customer debt.

---

BR-008

Booking calculations must use BookingCalculationService.

---

BR-009

Pending Amount can never be negative.

---

BR-010

Customer Credit replaces negative pending balances.

---

BR-011

Booking status becomes Delivered automatically when Pending Amount becomes zero.

No manual delivery process exists in Version 1.0.

---

# 6.13 Validation Rules

Booking Date

* Required.

---

Delivery Date

* Required.

---

Customer Name

* Required.

---

Mobile Number

* Required.

---

Pieces

* Required.
* Must be greater than zero.

---

Amount

* Required.
* Must be greater than zero.

---

# 6.14 Audit Requirements

The following actions must create audit records:

* Booking Created
* Booking Updated
* Booking Cancelled
* Duplicate Override
* Status Change

Each audit entry records:

* User
* Date
* Time
* Previous Values
* New Values
* Action Performed

---

# 6.15 Acceptance Criteria

The Booking module is considered complete when:

✓ Bookings can be created.

✓ Duplicate bookings are prevented.

✓ Booking numbers are generated automatically.

✓ Branch isolation is enforced.

✓ Financial calculations are delegated to BookingCalculationService.

✓ Cancelled bookings create no debt.

✓ Delivered status is assigned automatically.

✓ All changes are auditable.

✓ All business rules pass unit and feature tests.

# 7. Payment Module

---

# 7.1 Purpose

The Payment module records money received from customers against one or more bookings.

It is the only module responsible for reducing customer outstanding balances.

All financial effects of payments must flow through the BookingCalculationService.

---

# 7.2 Payment Information

Each payment record contains:

| Field          | Required |
| -------------- | -------- |
| Date           | Yes      |
| Bill Number    | Yes      |
| Payment Amount | Yes      |
| Payment Method | Yes      |

Payment Methods:

* Cash
* Card
* Bank Transfer

No additional payment methods are included in Version 1.0.

---

# 7.3 Payment Workflow

User opens Payment screen.

↓

Date defaults to today.

↓

Enter Bill Number.

↓

Press **Enter** or click **Add Bill**.

↓

System validates the bill.

↓

Booking information loads.

↓

User enters Pay Now amount.

↓

Repeat for additional bills if required.

↓

Select Payment Method.

↓

Save Payment.

↓

Form clears.

↓

Cursor returns to Bill Number.

---

# 7.4 Bill Validation

When a Bill Number is entered:

If the bill exists:

* Load Booking Amount.
* Load Total Paid.
* Load Pending Amount.

If the bill does not exist:

* Display **"Bill Not Found"**.
* Do not add the bill.
* Disable saving until a valid bill is entered.

---

# 7.5 Multiple Bills

A single payment session may include multiple bills.

Example:

| Bill | Pay Now |
| ---- | ------: |
| 1021 |     200 |
| 1022 |     150 |
| 1023 |     100 |

Each bill is stored as an individual payment record.

There is no parent payment record in Version 1.0.

---

# 7.6 Payment Entry

Each bill displays:

| Field          |
| -------------- |
| Bill Number    |
| Booking Amount |
| Total Paid     |
| Pending Amount |
| Pay Now        |

The **Pay Now** field is editable.

---

# 7.7 Total Payment

Total Payment is automatically calculated.

Example:

```text
Bill 1021 = 200 AED

Bill 1022 = 150 AED

--------------------

Total Payment = 350 AED
```

Users cannot edit Total Payment manually.

---

# 7.8 Customer Credit

Overpayments are permitted.

Example:

Booking Amount = 500 AED

Already Paid = 300 AED

Pending = 200 AED

Payment = 250 AED

Result:

Paid = 550 AED

Pending = 0 AED

Customer Credit = 50 AED

Customer Credit is created automatically.

Users are not shown any confirmation dialog.

---

# 7.9 Duplicate Bills

The same bill cannot be added twice during one payment session.

Example:

1021

↓

Added

↓

1021

↓

Rejected

Message:

"Bill already added."

---

# 7.10 Payment List

Payment List displays:

| Column         |
| -------------- |
| Date           |
| Bill Number    |
| Amount         |
| Payment Method |

Supports:

* Search
* Sorting
* Filtering

---

# 7.11 Editing Payments

Payments may be edited.

Editing a payment must never directly modify booking balances.

The system shall recalculate the booking financial summary through BookingCalculationService after every successful edit.

No controller or UI component may manually update booking totals.

Editable fields:

* Date
* Amount
* Payment Method

Every edit automatically recalculates booking balances.

Every edit must create an Audit Log entry.

---

# 7.12 Deleting Payments

Payments cannot be deleted.

Financial history must remain intact.

Corrections are performed by editing existing payments.

---

# 7.13 Payment Status

Payments do not have their own status.

The payment immediately affects the booking.

Booking Status is recalculated automatically.

---

# 7.14 Business Rules

BR-101

Bill Number must exist.

---

BR-102

Payment Amount must be greater than zero.

---

BR-103

Total Payment is calculated automatically.

---

BR-104

Duplicate bills are not allowed within one payment session.

---

BR-105

Overpayments create Customer Credit.

---

BR-106

Pending Amount can never become negative.

---

BR-107

Editing a payment recalculates financial balances automatically.

---

BR-108

Payments cannot be deleted.

---

BR-109

Fully Paid bookings automatically become **Delivered**.

There is no separate Delivery module.

---

# 7.15 Validation Rules

Date

* Required.

---

Bill Number

* Required.
* Must exist.

---

Amount

* Required.
* Greater than zero.

---

Payment Method

* Required.
* Must be one of:

  * Cash
  * Card
  * Bank Transfer

---

# 7.16 Audit Requirements

The following actions create Audit entries:

* Payment Created
* Payment Edited
* Payment Method Changed
* Payment Date Changed
* Payment Amount Changed

Audit entries record:

* User
* Date
* Time
* Previous Values
* New Values
* Action

---

# 7.17 User Interface Behaviour

The Payment screen must:

* Default Date to today.
* Allow date editing.
* Support **Enter** key to add bills.
* Support **Add Bill** button.
* Automatically calculate totals.
* Clear the form after successful save.
* Return cursor to Bill Number.
* Prevent duplicate bill entries.
* Display validation immediately.

---

# 7.18 Acceptance Criteria

The Payment module is complete when:

✓ Payments can be received.

✓ Multiple bills can be processed in one session.

✓ Every bill creates its own payment record.

✓ Customer Credit is created automatically for overpayments.

✓ Booking balances recalculate automatically.

✓ Payments cannot be deleted.

✓ All edits are audited.

✓ Fully paid bookings automatically become **Delivered**.

✓ Unit Tests and Feature Tests pass successfully.

# 8. Expense Module

---

# 8.1 Purpose

The Expense module records all business expenses incurred during daily operations.

Every expense must originate from an Expense Master to ensure standardized classification and reporting.

Free-text expense names are not permitted.

---

# 8.2 Expense Information

Each expense record contains:

| Field          | Required  |
| -------------- | --------- |
| Date           | Yes       |
| Expense Master | Yes       |
| Department     | Automatic |
| Category       | Automatic |
| Amount         | Yes       |

Department and Category are automatically populated from the selected Expense Master.

Users cannot manually modify these values.

---

# 8.3 Expense Workflow

User opens Expense screen.

↓

Date defaults to today.

↓

Select Expense Master.

↓

Department loads automatically.

↓

Category loads automatically.

↓

Enter Amount.

↓

Save Expense.

↓

Expense saved.

↓

Form clears.

↓

Cursor returns to Expense Master.

---

# 8.4 Expense Master

Every expense must be linked to an Expense Master.

Expense Master contains:

* Expense Name
* Department
* Category

Expense Masters are maintained under the Master Data module.

---

# 8.5 Automatic Field Population

Selecting an Expense Master automatically fills:

| Field      | Behaviour |
| ---------- | --------- |
| Department | Read Only |
| Category   | Read Only |

Users cannot override these values.

This guarantees reporting consistency across the ERP.

---

# 8.6 Expense List

Expense List displays:

| Column       |
| ------------ |
| Date         |
| Expense Name |
| Department   |
| Category     |
| Amount       |

Supports:

* Search
* Sorting
* Filtering

---

# 8.7 Editing Expenses

Expenses may be edited.

Editable fields:

* Date
* Expense Master
* Amount

Changing the Expense Master automatically refreshes:

* Department
* Category

Every edit creates an Audit Log entry.

---

# 8.8 Deleting Expenses

Expenses may be deleted.

Deletion requires user confirmation.

Example:

Delete Expense?

Expense Name

Amount

[Delete]

[Cancel]

Every deletion must create an Audit Log entry.

---

# 8.9 Business Rules

BR-201

Every expense must use an Expense Master.

---

BR-202

Department is derived from Expense Master.

---

BR-203

Category is derived from Expense Master.

---

BR-204

Department cannot be edited manually.

---

BR-205

Category cannot be edited manually.

---

BR-206

Amount must be greater than zero.

---

BR-207

Expense screen clears after successful save.

---

BR-208

Expense deletion requires confirmation.

---

# 8.10 Validation Rules

Date

* Required.

---

Expense Master

* Required.

---

Amount

* Required.
* Greater than zero.

---

Department

* Automatically assigned.

---

Category

* Automatically assigned.

---

# 8.11 Audit Requirements

The following actions generate Audit entries:

* Expense Created
* Expense Updated
* Expense Deleted
* Expense Master Changed
* Amount Changed
* Date Changed

Each Audit entry records:

* User
* Date
* Time
* Previous Values
* New Values
* Action Performed

---

# 8.12 User Interface Behaviour

The Expense screen must:

* Default Date to today.
* Allow editing of the date.
* Automatically populate Department.
* Automatically populate Category.
* Prevent editing of Department.
* Prevent editing of Category.
* Save without page refresh.
* Clear the form after successful save.
* Return cursor to Expense Master.
* Display immediate validation messages.

---

# 8.13 Acceptance Criteria

The Expense module is complete when:

✓ Expenses can be created.

✓ Every expense is linked to an Expense Master.

✓ Department and Category populate automatically.

✓ Department and Category cannot be edited manually.

✓ Expenses can be edited.

✓ Expenses can be deleted after confirmation.

✓ Every change is recorded in the Audit Log.

✓ Expense List displays the required information.

✓ All validation rules are enforced.

✓ Unit Tests and Feature Tests pass successfully.

# 9. Master Data

---

# 9.1 Purpose

The Master Data module provides centralized management of reference data used throughout the ERP.

Master Data eliminates duplicate data entry, enforces consistency, and standardizes business operations.

Business transactions must reference Master Data whenever applicable.

---

# 9.2 Master Data Modules

Version 1.0 contains four Master Data modules:

* Departments
* Categories
* Expense Masters
* Employees

Each module supports:

* Create
* Edit
* Delete
* Search

---

# 9.3 Departments

## Purpose

Departments classify business activities.

Examples:

* Employees
* Utilities
* Office
* Transport
* Maintenance

Departments are created manually by administrators.

Department names must be unique.

---

### Department Fields

| Field           | Required |
| --------------- | -------- |
| Department Name | Yes      |

---

### Business Rules

MD-001

Department names must be unique.

---

MD-002

Departments may be edited.

---

MD-003

Departments may be deleted only if they are not referenced by any Expense Master.

---

# 9.4 Categories

## Purpose

Categories provide a second level of expense classification.

Examples:

* Salary
* Electricity
* Water
* Fuel
* Rent

Categories are created manually.

Category names must be unique.

---

### Category Fields

| Field         | Required |
| ------------- | -------- |
| Category Name | Yes      |

---

### Business Rules

MD-004

Category names must be unique.

---

MD-005

Categories may be edited.

---

MD-006

Categories cannot be deleted while referenced by an Expense Master.

---

# 9.5 Expense Masters

## Purpose

Expense Masters standardize expense entry.

Users never manually type expense names during daily operations.

---

### Fields

| Field        | Required |
| ------------ | -------- |
| Expense Name | Yes      |
| Department   | Yes      |
| Category     | Yes      |

---

### Behaviour

Selecting an Expense Master during expense entry automatically populates:

* Department
* Category

These values are read-only during expense entry.

---

### Business Rules

MD-007

Expense Name must be unique.

---

MD-008

Every Expense Master belongs to exactly one Department.

---

MD-009

Every Expense Master belongs to exactly one Category.

---

MD-010

Expense Masters may be edited.

---

MD-011

Expense Masters may be deleted only if they have never been used by an Expense.

---

# 9.6 Employees

## Purpose

Employee records store staff information for operational use.

Version 1.0 does not include Payroll.

---

### Fields

| Field         | Required |
| ------------- | -------- |
| Employee ID   | Yes      |
| Employee Name | Yes      |
| Mobile Number | No       |
| Status        | Yes      |

---

Status values:

* Active
* Inactive

---

### Business Rules

MD-012

Employee IDs must be unique.

---

MD-013

Employees may be edited.

---

MD-014

Inactive employees remain visible in historical records.

---

# 9.7 User Interface Behaviour

Every Master Data screen must:

* Display a searchable list.
* Support Create.
* Support Edit.
* Support Delete.
* Validate duplicate names.
* Display success notifications.
* Display validation errors immediately.

---

# 9.8 Audit Requirements

The following actions create Audit entries:

* Department Created

* Department Updated

* Department Deleted

* Category Created

* Category Updated

* Category Deleted

* Expense Master Created

* Expense Master Updated

* Expense Master Deleted

* Employee Created

* Employee Updated

* Employee Deleted

Each Audit entry records:

* User
* Date
* Time
* Previous Values
* New Values
* Action

---

# 9.9 Acceptance Criteria

The Master Data module is complete when:

✓ Departments are manageable.

✓ Categories are manageable.

✓ Expense Masters are manageable.

✓ Employees are manageable.

✓ Duplicate names are prevented.

✓ Referential integrity is enforced.

✓ Every change is audited.

✓ All validation rules pass.

# 10. Financial Rules

---

## 10.1 Purpose

These rules define the financial behaviour of the ERP.

Every module that affects money must comply with these rules.

No module may implement alternative financial logic.

---

## 10.2 Single Source of Truth

All booking financial calculations must be performed by the BookingCalculationService.

Controllers, UI components, repositories, reports and APIs must never calculate balances independently.

---

## 10.3 Outstanding Balance

Outstanding Balance is calculated as:

Pending = Booking Amount − Total Valid Payments

Pending can never be negative.

---

## 10.4 Customer Credit

If payments exceed the booking amount:

Pending = 0

Excess payment becomes Customer Credit.

Customer Credit is created automatically.

---

## 10.5 Cancelled Bookings

Cancelled bookings:

* Produce no customer debt.
* Produce no pending balance.
* Remain visible for audit.
* Preserve payment history.

---

## 10.6 Valid Payments

Only valid payments affect balances.

Deleted, failed or invalid payments must not affect financial calculations.

---

## 10.7 Delivered Status

A booking becomes Delivered automatically when:

Pending Amount = 0

No manual delivery confirmation exists in Version 1.0.

---

## 10.8 Editing Payments

Editing a payment recalculates financial summaries automatically.

Manual balance updates are prohibited.

---

## 10.9 Financial Invariants

The following statements must always remain true:

* Pending ≥ 0
* Customer Credit ≥ 0
* Booking Amount ≥ 0
* Payment Amount > 0

Violating these rules is considered a system error.

---

# 11. Validation Rules

---

## General Principles

Every form validates before saving.

Validation errors must be immediate.

Invalid data must never reach the database.

---

## Booking Validation

* Customer required.
* Mobile required.
* Pieces > 0.
* Amount > 0.
* Delivery Date required.

---

## Payment Validation

* Bill must exist.
* Amount > 0.
* Payment Method required.
* Duplicate bill entries prohibited.

---

## Expense Validation

* Expense Master required.
* Amount > 0.

---

## Master Data Validation

Departments

* Unique name.

Categories

* Unique name.

Expense Masters

* Unique name.

Employees

* Unique Employee ID.

---

# 12. Audit Rules

---

## Purpose

Every important business event must be traceable.

Audit records can never be edited.

Audit records can never be deleted.

---

## Audit Events

Booking

* Create
* Update
* Cancel
* Duplicate Override

Payment

* Create
* Update

Expense

* Create
* Update
* Delete

Master Data

* Create
* Update
* Delete

---

## Audit Record

Every audit entry stores:

* User
* Timestamp
* Module
* Action
* Previous Values
* New Values
* IP Address (if available)

---

# 13. Status Definitions

---

## Booking Status

Pending

Booking exists.

No payment received.

---

Partially Paid

Payment received.

Pending amount greater than zero.

---

Delivered

Pending amount equals zero.

Automatically assigned.

---

Cancelled

Booking cancelled.

Produces no customer debt.

---

# 14. User Interface Standards

---

Every screen in Version 1.0 follows these rules.

## Data Entry

* Today's date selected automatically.
* Date editable.
* Keyboard friendly.
* Minimal mouse usage.

---

## Save

After successful save:

* Success notification.
* Form cleared.
* Cursor returns to first field.

---

## Lists

Every list supports:

* Search
* Sorting
* Filtering

---

## Forms

Forms must:

* Prevent duplicate submission.
* Validate immediately.
* Display friendly messages.
* Use consistent layouts.

---

# 15. Future Modules

Future versions may include:

* Dashboard
* Reports
* Inventory
* Suppliers
* Purchasing
* Payroll
* Customer Ledger
* Notifications
* Barcode Support
* Multi Currency
* Tax Management

These modules are outside the scope of Version 1.0.

---

# 16. Out of Scope

Version 1.0 intentionally excludes:

* Inventory Management
* Payroll
* Supplier Management
* Purchase Orders
* Sales Invoicing
* CRM
* Accounting Ledger
* Financial Statements

---

# 17. Glossary

Booking

Customer service order.

---

Payment

Money received against a booking.

---

Expense

Business expenditure.

---

Expense Master

Template defining expense classification.

---

Department

High-level expense grouping.

---

Category

Detailed expense grouping.

---

Customer Credit

Money received beyond the outstanding balance.

---

Pending

Outstanding customer liability.

---

Delivered

Booking with zero pending balance.

---

# 18. Version History

| Version | Date            | Description                                |
| ------- | --------------- | ------------------------------------------ |
| 1.0     | Initial Release | Initial Product Requirements Specification |
