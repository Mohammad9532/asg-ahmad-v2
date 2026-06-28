# Routes Inventory

## File Name
`aiRoutes.js`

## Purpose
Provides an endpoint for AI-assisted chat to query and analyze shop data.

## Responsibilities
- Integrates with Groq SDK to process natural language queries over business data context.
- Secures the endpoint using token authentication.

## Main Functions
- `POST /ai/chat`: Handles AI prompt processing and response generation.

## Imports
- `express`, `groq-sdk`, `../middleware/auth`

## Exports
- Express router object

## Used By
- Express application entry point (typically `index.js` or `server.js`)

## Depends On
- `groq-sdk`, `express`

## Risk Level
Low

## Business Importance
Optional

---

## File Name
`analyticsRoutes.js`

## Purpose
Manages analytics-related endpoints, including financial targets and actuals comparisons.

## Responsibilities
- Allows upserting monthly target amounts.
- Aggregates actual monthly bookings against set targets for a specific shop.
- Uses fuzzy matching to dynamically locate shop models.

## Main Functions
- `POST /targets`: Upserts shop target.
- `GET /analytics/compare`: Fetches comparison between actual bookings and targets.

## Imports
- `express`, `mongoose`, `../models/Target`, `../middleware/auth`

## Exports
- Express router object

## Used By
- Express application entry point

## Depends On
- `mongoose`, `express`

## Risk Level
Medium

## Business Importance
Important

---

## File Name
`authRoutes.js`

## Purpose
Manages user authentication, token generation, and registration.

## Responsibilities
- Handles user login and validates credentials against hashed passwords.
- Issues JWT tokens for session management.
- Handles new user registration strictly for admin users.
- Provides a seeding script to ensure an admin user exists.

## Main Functions
- `POST /login`: Authenticates users and returns JWT.
- `POST /register`: Admin-only route to create new users.
- `seedAdminUser`: Utility to insert a default admin.

## Imports
- `express`, `bcryptjs`, `jsonwebtoken`, `../models/User`, `../middleware/auth`

## Exports
- `{ authRoutes, seedAdminUser }`

## Used By
- Express application entry point

## Depends On
- `bcryptjs`, `jsonwebtoken`, `express`

## Risk Level
High

## Business Importance
Critical

---

## File Name
`globalRoutes.js`

## Purpose
Provides aggregate global summary endpoints across all shops.

## Responsibilities
- Aggregates net bookings, deliveries, expenses, and accruals for all predefined shops.
- Uses parallel processing (`Promise.all`) for cross-shop aggregation.
- Applies caching middleware to optimize performance.

## Main Functions
- `GET /global/summary`: Fetches high-level metrics for all shops within a date range.

## Imports
- `express`, `mongoose`, `../utils/constants`, `../middleware/auth`, `../middleware/cache`

## Exports
- Express router object

## Used By
- Express application entry point

## Depends On
- `mongoose`, `express`

## Risk Level
Medium

## Business Importance
Important

---

## File Name
`ledgerRoutes.js`

## Purpose
Manages the settings and adjustments for the daily cash ledger.

## Responsibilities
- Saves and retrieves ledger settings (initial balance, start date).
- Saves daily ledger adjustments (short/extra cash amounts).

## Main Functions
- `POST /:shop/ledger/settings`: Sets initial ledger balance.
- `GET /:shop/ledger/settings`: Gets ledger settings.
- `POST /:shop/ledger/adjustment`: Records a daily short/extra cash adjustment.

## Imports
- `express`, `mongoose`, `../models/Ledger`, `../middleware/auth`

## Exports
- Express router object

## Used By
- Express application entry point

## Depends On
- `mongoose`, `express`

## Risk Level
Medium

## Business Importance
Important

---

## File Name
`masterRoutes.js`

## Purpose
Provides CRUD operations for Expense Master Data.

## Responsibilities
- Lists active master items.
- Creates new master entities preventing target ID duplication.
- Updates existing master entities and supports deactivation.

## Main Functions
- `GET /master/expenses`: Fetches all active items.
- `POST /master/expenses`: Creates a new expense master record.
- `PUT /master/expenses/:id`: Updates or deactivates an item.

## Imports
- `express`, `../middleware/auth`, `../models/ExpenseMaster`

## Exports
- Express router object

## Used By
- Express application entry point

## Depends On
- `express`

## Risk Level
Low

## Business Importance
Important

---

## File Name
`shopRoutes.js`

## Purpose
Dynamically generates standard and specialized routes for every shop defined in the system.

## Responsibilities
- Iterates over `SHOP_NAMES` to generate standard CRUD and summary routes for Bookings, Deliveries, and Expenses.
- Attaches specialist routes for audits, ledger history, diagnostics, and lifetime summaries using route creators.

## Main Functions
- Script executes dynamically to generate a massive router object binding model-specific routes for each shop.

## Imports
- `express`, `mongoose`, `../models/Transaction`, `../models/Audit`, `../middleware/auth`, `../utils/routeCreators`, `../utils/constants`

## Exports
- Express router object

## Used By
- Express application entry point

## Depends On
- `mongoose`, `express`, `../utils/routeCreators`

## Risk Level
High

## Business Importance
Critical
