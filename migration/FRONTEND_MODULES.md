# Frontend Modules Inventory

## customers.js
## Purpose
Customer directory aggregator.
## Responsibilities
Normalizes customer phone numbers to identify unique customers across shops, providing cross-shop customer history and ordering volume statistics.
## Main Functions
`aggregateCustomers`, `renderCustomerDashboard`, `searchCustomers`, `renderCustomerPurchases`, `handleCustomerSort`, `handleCustomerSearch`, `exportCustomersCSV`
## Imports
`state` (from state.js), `SHOP_PREFIXES` (from config.js), `formatCurrency` (from utils.js)
## Exports
`aggregateCustomers`
## Used By
`main.js`, `render.js`
## Depends On
`state.js`, `config.js`, `utils.js`
## Risk Level
Medium
## Business Importance
Important

## print.js
## Purpose
Print/PDF generation service.
## Responsibilities
Formats and prints specific reports and dashboards for physical record-keeping and sharing. Modifies DOM for print styles and restores it afterwards.
## Main Functions
`printDashboard`, `printLedger`, `printStockAuditList`
## Imports
None explicitly required for basic DOM manipulation (though may use global state implicitly).
## Exports
None (attached to global window).
## Used By
`main.js`, `ui.js`, UI Event Handlers
## Depends On
Global `window` object, DOM structure.
## Risk Level
Low
## Business Importance
Important

## render_tables.js
## Purpose
Reusable table rendering logic.
## Responsibilities
Provides generalized functions to render data tables for various entities (bookings, deliveries, expenses) with built-in support for pagination, sorting, and styling.
## Main Functions
`renderStandardTable`, `renderDailyNetBookingTable`, `renderDailyCategoryTrendTable`, `handlePageChange`, `renderPagination`
## Imports
`state` (from state.js), `SHOP_PREFIXES` (from config.js), `formatCurrency`, `calculateCanceledSum`, `isCanceledStatus`, `sortArray`, `getSortIcon` (from utils.js)
## Exports
`renderStandardTable`, `renderDailyNetBookingTable`, `renderDailyCategoryTrendTable`, `handlePageChange`
## Used By
`render.js`, `main.js`
## Depends On
`state.js`, `config.js`, `utils.js`
## Risk Level
Low
## Business Importance
Important

## excess_delivery.js
## Purpose
Reconciliation dashboard for excess deliveries.
## Responsibilities
Identifies, tracks, and displays discrepancies between booking data and delivery audits (specifically where delivery exceeds booking or is detached).
## Main Functions
`renderExcessDeliveryView`, `fetchExcessDeliveryData`, `renderExcessTable`, `handleExcessSearch`
## Imports
`state` (from state.js), `BASE_URL` (from config.js), `formatCurrency` (from utils.js)
## Exports
`renderExcessDeliveryView`
## Used By
`render.js`
## Depends On
`state.js`, `config.js`, `utils.js`, Backend API
## Risk Level
Medium
## Business Importance
Important

## dailyLedger.js
## Purpose
Cash book implementation.
## Responsibilities
Tracks daily debit/credit entries, opening/closing balances, manual adjustments, and missing/extra cash tracking for physical cash box reconciliation.
## Main Functions
`renderDailyLedger`, `fetchLedgerData`, `addManualEntry`, `deleteLedgerEntry`, `saveLedgerSettings`, `printLedger`
## Imports
`state` (from state.js), `BASE_URL` (from config.js), `formatCurrency` (from utils.js)
## Exports
`renderDailyLedger`
## Used By
`render.js`, `main.js`
## Depends On
`state.js`, `config.js`, `utils.js`, Backend API
## Risk Level
High
## Business Importance
Critical

## config.js
## Purpose
Client-side configuration.
## Responsibilities
Defines global constants, shop prefixes, and API base URL.
## Main Functions
None.
## Imports
None.
## Exports
`SHOP_PREFIXES`, `BASE_URL`, `DATE_PRESETS`, `FISCAL_YEARS`
## Used By
Various frontend modules (e.g., `api.js`, `render.js`, `customers.js`).
## Depends On
None.
## Risk Level
Low
## Business Importance
Critical

## state.js
## Purpose
Global state management.
## Responsibilities
Maintains the single source of truth for the frontend state, including current selections, cached data results, and pagination.
## Main Functions
None.
## Imports
None.
## Exports
`state` object
## Used By
Almost all frontend modules.
## Depends On
None.
## Risk Level
High
## Business Importance
Critical

## api.js
## Purpose
Client-side data fetching service.
## Responsibilities
Handles all HTTP requests to the backend Express server, authenticates requests with JWT, and stores responses in the global state cache.
## Main Functions
`fetchEndpoint`, `fetchAllData`, `fetchShopData`, `login`, `logout`
## Imports
`state` (from state.js), `BASE_URL`, `SHOP_PREFIXES` (from config.js), `showLoading` (from ui.js)
## Exports
`fetchEndpoint`, `fetchAllData`, `fetchShopData`, `logout`, `openGlobalProfitModal`
## Used By
`main.js`, `router.js`, `dailyLedger.js`, etc.
## Depends On
`state.js`, `config.js`, `ui.js`, Backend API
## Risk Level
High
## Business Importance
Critical

## router.js
## Purpose
URL-based navigation and RBAC guard enforcement.
## Responsibilities
Synchronizes UI state based on URL hash changes, restricting access to shops based on the user's role and invoking data rendering.
## Main Functions
`handleRouting`, `navigateTo`
## Imports
`state` (from state.js), `setActiveShop`, `setActiveDataType` (from ui.js), `renderContent` (from render.js), `SHOP_PREFIXES` (from config.js)
## Exports
`handleRouting`, `navigateTo`
## Used By
`main.js`
## Depends On
`state.js`, `ui.js`, `render.js`, `config.js`
## Risk Level
Medium
## Business Importance
Critical

## ui.js
## Purpose
Core UI interactivity functionality.
## Responsibilities
Manages non-data-specific UI elements such as the sidebar, dark mode toggling, date range selection inputs, and general modal handling.
## Main Functions
`initDarkMode`, `initFiscalYearDropdown`, `setDateRange`, `toggleSidebar`, `toggleDarkMode`, `setActiveShop`, `setActiveDataType`
## Imports
`state` (from state.js), `navigateTo` (from router.js), `sortArray`, `getSortIcon` (from utils.js)
## Exports
`initDarkMode`, `initFiscalYearDropdown`, `setDateRange`, `handleSort`, `handleTableSearch`, `toggleSidebar`, `toggleDarkMode`, `setActiveShop`, `setActiveDataType`, `filterEmployeeGrid`, `updatePeriodOptions`, `applyFiscalPeriod`, `showLoading`
## Used By
`main.js`, `router.js`, UI Event Handlers
## Depends On
`state.js`, `router.js`, `utils.js`
## Risk Level
Low
## Business Importance
Important

## render_monthly.js
## Purpose
Aggregated monthly financial summaries.
## Responsibilities
Calculates and renders a comprehensive financial view over time (monthly breakdown) for bookings, deliveries, and expenses.
## Main Functions
`renderMonthlySummary`
## Imports
`state` (from state.js), `formatCurrency` (from utils.js)
## Exports
`renderMonthlySummary`
## Used By
`render.js`
## Depends On
`state.js`, `utils.js`
## Risk Level
Medium
## Business Importance
Important

## master_data.js
## Purpose
Master data UI management.
## Responsibilities
Provides UI for managing standard lookup lists, such as employee directories and general payee definitions, including dynamic ID generation.
## Main Functions
`renderMasterDataTab`, `fetchMasterData`, `saveMasterData`, `deleteMasterData`
## Imports
`BASE_URL` (from config.js), `formatCurrency` (from utils.js)
## Exports
None (attached to window)
## Used By
`main.js`, UI Event Handlers
## Depends On
`config.js`, `utils.js`, Backend API
## Risk Level
Medium
## Business Importance
Important

## compare.js & compare_bookings.js
## Purpose
Financial target and growth comparison dashboards.
## Responsibilities
Provides comparative views of business performance across different time cycles or specific date periods.
## Main Functions
`renderCompareDashboard`, `renderShopCompareBookings`
## Imports
`state` (from state.js), `BASE_URL`, `SHOP_PREFIXES` (from config.js), `formatCurrency` (from utils.js)
## Exports
`renderCompareDashboard`, `renderShopCompareBookings`
## Used By
`render.js`, `main.js`
## Depends On
`state.js`, `config.js`, `utils.js`
## Risk Level
Medium
## Business Importance
Important

## audit.js & stock_audit.js
## Purpose
Gap analysis and stock auditing logic.
## Responsibilities
`audit.js` finds missing bill sequences. `stock_audit.js` reconciles physical stock against system deliveries.
## Main Functions
`openMissingBillsModal`, `scanMissingBills`, `renderStockAuditView`
## Imports
`state` (from state.js), `SHOP_PREFIXES`, `BASE_URL` (from config.js), `fetchEndpoint` (from api.js), `showLoading` (from ui.js), `formatCurrency` (from utils.js)
## Exports
`openMissingBillsModal`, `closeMissingBillsModal`, `autoSetRange`, `scanMissingBills`, `downloadMissing`, `copyMissing`, `fetchSingleShop`, `downloadAllMissingCSV`, `renderStockAuditView`
## Used By
`main.js`, `render.js`
## Depends On
`state.js`, `config.js`, `api.js`, `ui.js`, `utils.js`, Backend API
## Risk Level
High
## Business Importance
Critical

## render.js
## Purpose
Main dashboard rendering dispatcher.
## Responsibilities
Receives routing updates and orchestrates rendering the correct view (shop dashboard, specific data table, overview) based on the selected shop and data type.
## Main Functions
`renderContent`, `renderContentSync`, `renderShopDashboard`, `renderOverviewDashboard`
## Imports
`state` (from state.js), `SHOP_PREFIXES`, `BASE_URL` (from config.js), `formatCurrency`, `calculateCanceledSum`, `isCanceledStatus`, `sortArray`, `getSortIcon` (from utils.js), `renderMonthlySummary` (from render_monthly.js), `renderStockAuditView` (from stock_audit.js), `renderExcessDeliveryView` (from excess_delivery.js), `renderDailyLedger` (from dailyLedger.js), `renderShopCompareBookings` (from compare_bookings.js), `renderCompareDashboard` (from compare.js), `aggregateCustomers` (from customers.js), `renderStandardTable`, `renderDailyNetBookingTable`, `renderDailyCategoryTrendTable` (from render_tables.js)
## Exports
`renderContent`
## Used By
`main.js`, `router.js`
## Depends On
All rendering sub-modules, `state.js`, `config.js`, `utils.js`
## Risk Level
High
## Business Importance
Critical

## main.js
## Purpose
Application entry point.
## Responsibilities
Initializes the application, enforces authentication guards, attaches global window functions, and bootstraps routing.
## Main Functions
`cleanupUIForRole`
## Imports
All frontend modules.
## Exports
None (side-effects).
## Used By
`index.html`
## Depends On
All frontend modules.
## Risk Level
High
## Business Importance
Critical
