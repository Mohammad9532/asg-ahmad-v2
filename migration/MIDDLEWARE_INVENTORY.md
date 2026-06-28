# Middleware Inventory

## File Name
`auth.js`

## Purpose
Validates authentication tokens and enforces Role-Based Access Control (RBAC).

## Responsibilities
- Intercepts requests to check for a valid JWT Bearer token.
- Bypasses public endpoints like `/login` and `/health`.
- Decodes the JWT and attaches user data to the request object.
- Enforces shop-level isolation so users can only access data for their assigned shop.
- Blocks non-admin users from accessing global routes.

## Main Functions
- `authenticateToken`: Express middleware function.

## Imports
- `jsonwebtoken`

## Exports
- `authenticateToken`, `JWT_SECRET`

## Used By
- All route files in `api/_lib/routes/`

## Depends On
- `jsonwebtoken`

## Risk Level
High

## Business Importance
Critical

---

## File Name
`cache.js`

## Purpose
Provides in-memory caching for API GET requests to improve performance.

## Responsibilities
- Caches JSON responses using the request URL as the key.
- Intercepts `res.json` to store data before sending it to the client.
- Sets cache control headers (`X-Cache: HIT/MISS`).
- Provides a utility to flush the cache.

## Main Functions
- `cacheMiddleware`: Express middleware wrapper to cache routes.
- `clearCache`: Helper to invalidate all cache entries.

## Imports
- `node-cache`

## Exports
- `cacheMiddleware`, `clearCache`

## Used By
- `api/_lib/routes/globalRoutes.js`

## Depends On
- `node-cache`

## Risk Level
Low

## Business Importance
Optional
