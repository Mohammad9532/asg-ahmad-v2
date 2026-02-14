/**
 * Express Backend Server Structure (api/index.js)
 * Modular version for better maintainability and performance.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { authRoutes, seedAdminUser } = require('./routes/authRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const shopRoutes = require('./routes/shopRoutes');
const aiRoutes = require('./routes/aiRoutes');
const globalRoutes = require('./routes/globalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- Middlewares ---
app.use(express.json());
app.use(cors());
app.use(require('compression')()); // Enable Gzip/Brotli

// --- Request Logger ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Routes Mounting ---
// Robust mounting: Some platforms strip /api prefix, some don't.
// We mount at both to be safe during migration/deployment.
const apiRoutes = [
    { path: '/auth', router: authRoutes },
    { path: '', router: ledgerRoutes },
    { path: '', router: analyticsRoutes },
    { path: '', router: aiRoutes },
    { path: '', router: globalRoutes },
    { path: '', router: shopRoutes }
];

apiRoutes.forEach(({ path: subPath, router: r }) => {
    app.use(`/api${subPath}`, r);
    // Only mount at root if it's not conflicting with static paths or if on Vercel
    if (process.env.VERCEL) {
        app.use(subPath || '/', r);
    }
});

// --- API 404 Handler (JSON) ---
app.use('/api', (req, res) => {
    console.warn(`[404] API Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: "API Route Not Found",
        path: req.path,
        method: req.method,
        suggestion: "Verify the endpoint exists in api/index.js"
    });
});

// --- Database Connection ---
let isDbConnected = false;
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully!');
        isDbConnected = true;
        seedAdminUser();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        // Do not exit process, allows server to serve static files/errors
    });

// Middleware to check DB connection
app.use((req, res, next) => {
    if (req.path.startsWith('/api') && !req.path.includes('health') && !isDbConnected) {
        return res.status(503).json({
            error: "Database Connection Error",
            message: "The server is unable to connect to the database. Please check MONGO_URI environment variable on Vercel."
        });
    }
    next();
});

// --- Static File Serving (SPA Support) ---
// Serve from '../dist' (where Vite builds) or '../client' (dev fallback)
const staticPath = path.join(__dirname, '../dist');
const devPath = path.join(__dirname, '../client');

// Serve static assets
app.use(express.static(staticPath));
app.use(express.static(devPath));

// Fallback: serve index.html for any non-API routes (SPA support)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        // Try dist first, then client
        const distIndex = path.resolve(staticPath, 'index.html');
        const clientIndex = path.resolve(devPath, 'index.html');

        const fs = require('fs');
        if (fs.existsSync(distIndex)) {
            return res.sendFile(distIndex);
        } else if (fs.existsSync(clientIndex)) {
            return res.sendFile(clientIndex);
        }
    }
    next();
});

// --- Export app for Vercel ---
module.exports = app;

// --- Server Start Listener (for local dev) ---
if (require.main === module) {
    // DEBUG: Global Error Handler
    app.use((err, req, res, next) => {
        console.error('Express Error Handler:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    });

    app.listen(PORT, () => {
        console.log(`🌍 Server is running on http://localhost:${PORT}`);
        console.log(`--- Ready to serve dynamic endpoints ---`);
    });
}
