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
// Robust mounting for Vercel: Handle both /api and stripped paths
const mountingPrefixes = process.env.VERCEL ? ['', '/api'] : ['/api'];

mountingPrefixes.forEach(prefix => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(prefix, ledgerRoutes);
    app.use(prefix, analyticsRoutes);
    app.use(prefix, aiRoutes);
    app.use(prefix, globalRoutes);
    app.use(prefix, shopRoutes);

    // Health check at both root and /api
    app.get(`${prefix}/health`, (req, res) => res.json({
        status: 'ok',
        environment: process.env.VERCEL ? 'vercel' : 'local',
        timestamp: new Date().toISOString()
    }));
});

// --- API 404 Handler (JSON) ---
app.use('/api', (req, res) => {
    res.status(404).json({ error: "API Route Not Found", path: req.path, method: req.method });
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

// --- Static File Serving (Local Dev Fallback Only) ---
if (!process.env.VERCEL) {
    const staticPath = path.join(__dirname, '../dist');
    const devPath = path.join(__dirname, '../client');
    app.use(express.static(staticPath));
    app.use(express.static(devPath));

    // SPA Fallback for local dev
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            const distIndex = path.resolve(staticPath, 'index.html');
            const clientIndex = path.resolve(devPath, 'index.html');
            const fs = require('fs');
            if (fs.existsSync(distIndex)) return res.sendFile(distIndex);
            if (fs.existsSync(clientIndex)) return res.sendFile(clientIndex);
        }
        next();
    });
}

// --- Deleted module.exports here and moved to bottom ---

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

// --- Export app for Vercel ---
module.exports = app;
