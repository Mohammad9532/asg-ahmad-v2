const NodeCache = require('node-cache');

// Standard Cache Instance
const cache = new NodeCache({ stdTTL: 300 });

/**
 * Cache middleware for API responses.
 * @param {number} duration - Cache duration in seconds (optional, defaults to 300)
 */
const cacheMiddleware = (duration = 300) => (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl || req.url;
    const cachedBody = cache.get(key);

    if (cachedBody) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedBody);
    }

    // Capture the original json method to intercept the response
    const originalJson = res.json;

    res.json = (body) => {
        // Store in cache
        cache.set(key, body, duration);
        res.setHeader('X-Cache', 'MISS');
        // Call original json method
        originalJson.call(res, body);
    };

    next();
};

/**
 * Helper to manually clear cache keys
 */
const clearCache = () => {
    cache.flushAll();
};

module.exports = { cacheMiddleware, clearCache };
