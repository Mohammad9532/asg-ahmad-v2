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
        next();
    });
};

module.exports = { authenticateToken, JWT_SECRET };
