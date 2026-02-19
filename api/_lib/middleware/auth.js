const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'a_very_secret_key_for_development_only_123';

const authenticateToken = (req, res, next) => {
    // Protected routes are under /api but public routes like /auth/login and /health are exempted
    if (req.path === '/auth/login' || req.path === '/health' || req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.status(401).json({ error: "Access Denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        req.user = user;

        // RBAC Enforcement
        if (user.role === 'admin') return next();

        if (user.role === 'shop') {
            const path = req.path.toLowerCase();
            const segments = path.split('/').filter(Boolean);

            // Block Global Access
            if (segments.includes('global')) {
                return res.status(403).json({ error: "Access Denied. Shop role cannot access global data." });
            }

            // Verify Shop Access (Expected path: /api/:shop/...)
            // Normal segments: ['auth', 'login'] or ['Gaidatailor', 'bookings', 'summary']
            if (segments.length > 0) {
                const requestedShop = segments[0]; // In /api/Gaidatailor, Segments[0] is often the shop if mounting logic is right

                // Let's be safer: find any segment that matches a shop prefix but doesn't match the user's shop
                const userShop = user.shop ? user.shop.toLowerCase() : null;

                // If it's a shop route but doesn't match the user's shop, block it.
                // Note: Index 0 might be the shop name if the route is /:shop/...
                if (userShop && requestedShop !== 'health' && requestedShop !== 'auth') {
                    if (requestedShop !== userShop) {
                        console.warn(`[AUTH] Blocked ${user.username} from accessing ${requestedShop}`);
                        return res.status(403).json({ error: `Access Denied. You are only authorized for ${user.shop}.` });
                    }
                }
            }
        }
        next();
    });
};

module.exports = { authenticateToken, JWT_SECRET };
