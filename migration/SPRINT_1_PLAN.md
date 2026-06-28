# Sprint 1: Master Data Implementation Plan

## Goal
Fully implement the Master Data module (Departments, Categories, Expense Masters, Employees) across the full stack to establish the strict dependency chain required before building the Expense module.

## Proposed Changes

### 1. Backend: API & Controllers
#### [NEW] `app/Http/Controllers/Api/DepartmentController.php`
- Implement full CRUD (`index`, `store`, `update`, `destroy`).
- Enforce MD-001 (Unique names), MD-003 (Cannot delete if referenced).

#### [NEW] `app/Http/Controllers/Api/ExpenseCategoryController.php`
- Implement full CRUD.
- Enforce MD-004 (Unique names per department), MD-006 (Cannot delete if referenced).

#### [MODIFY] `app/Http/Controllers/Api/ExpenseMasterController.php`
- Flesh out empty stub with full CRUD.
- Enforce MD-007 (Unique names), MD-011 (Cannot delete if used).

#### [MODIFY] `app/Http/Controllers/Api/EmployeeController.php`
- Flesh out empty stub with full CRUD.
- Enforce MD-012 (Unique IDs), handle status toggling.

#### [NEW] `app/Http/Requests/*` (Validation)
- Create strict FormRequests for each entity (e.g., `StoreDepartmentRequest`) to validate data before saving, adhering exactly to Chapter 11 Validation Rules.

#### [NEW] `app/Http/Resources/*` (Transformers)
- Create resources to ensure clean JSON responses.

#### [MODIFY] `routes/api.php`
- Register `departments` and `expense-categories` `apiResource` routes.

#### [MODIFY] Audit Log Integration
- Wire up `AuditService::log` across all 4 controllers for `created`, `updated`, and `deleted` actions to satisfy section 9.8 requirements.

---

### 2. Frontend: UI & Navigation
#### [MODIFY] `src/App.jsx` & `src/components/layout/AppShell.jsx`
- Add "Master Data" to the sidebar.
- Implement the nested or sub-menu navigation routing to `Departments`, `Categories`, `Expense Masters`, and `Employees`.

#### [NEW] `src/modules/master-data/DepartmentsPage.jsx`
- Searchable list.
- Fast, modal-based Create/Edit forms enforcing keyboard accessibility.

#### [NEW] `src/modules/master-data/CategoriesPage.jsx`
- Searchable list mapping Category to its parent Department.

#### [NEW] `src/modules/master-data/ExpenseMastersPage.jsx`
- Searchable list.
- Cascading dropdowns (select Department -> select Category).

#### [NEW] `src/modules/master-data/EmployeesPage.jsx` (Replaces stub)
- Searchable list managing Employee Code, Name, and Status.

---

## User Review Required
1. **Frontend Layout**: For the "Master Data" navigation, would you prefer the links to expand directly in the main Sidebar (accordion style), or should "Master Data" be a single sidebar link that opens a dedicated page with inner tabs?
2. **Deletion**: I will rely on standard Laravel foreign key constraints (`restrictOnDelete` which is already in the migrations) wrapped in `try/catch` blocks to gracefully return 400 errors if a user attempts to delete a Department actively used by an Expense Master.

Please review and approve the plan, or let me know your layout preference for the Master Data navigation!
