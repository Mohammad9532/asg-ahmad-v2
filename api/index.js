/**
 * Express Backend Server Structure (api/index.js)
 * Modular version for better maintainability and performance.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { authRoutes, seedAdminUser } = require('./_lib/routes/authRoutes');
const ledgerRoutes = require('./_lib/routes/ledgerRoutes');
const analyticsRoutes = require('./_lib/routes/analyticsRoutes');
const shopRoutes = require('./_lib/routes/shopRoutes');
const aiRoutes = require('./_lib/routes/aiRoutes');
const globalRoutes = require('./_lib/routes/globalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- Database Connection & Initialisation ---
let isDbConnected = false;
let dbErrorCode = null;
let dbErrorMessage = null;

// Remove the global disable to avoid "Cannot call users.findOne() before connection" errors.
// Mongoose will now buffer commands until connected, but we've set a strict 5s timeout below.

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables!');
} else {
    console.log('[DB] Connecting to MongoDB...');
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('✅ MongoDB connected successfully!');
            isDbConnected = true;
            dbErrorCode = null;
            dbErrorMessage = null;
            if (typeof seedAdminUser === 'function') {
                seedAdminUser();
            }
        })
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            isDbConnected = false;
            dbErrorCode = err.name || 'ConnectionError';
            dbErrorMessage = err.message;
        });

    // Explicit listeners for state tracking
    mongoose.connection.on('connected', () => { isDbConnected = true; });
    mongoose.connection.on('disconnected', () => { isDbConnected = false; console.warn('⚠️ MongoDB disconnected'); });
    mongoose.connection.on('error', (err) => { console.error('🔴 MongoDB Runtime Error:', err); });
}

// --- Middlewares ---
app.use(express.json());
app.use(cors());
app.use(require('compression')()); // Enable Gzip/Brotli
const { cacheMiddleware } = require('./_lib/middleware/cache');

// --- Request Logger ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Routes Mounting ---
const mountingPrefixes = process.env.VERCEL ? ['', '/api'] : ['/api'];

mountingPrefixes.forEach(prefix => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(prefix, ledgerRoutes);
    app.use(prefix, analyticsRoutes);
    app.use(prefix, aiRoutes);
    app.use(prefix, globalRoutes);
    app.use(prefix, shopRoutes);

    app.get(`${prefix}/health`, (req, res) => res.json({
        status: 'ok',
        dbConnected: isDbConnected,
        dbState: mongoose.connection.readyState, // 0: disc, 1: conn, 2: connecting, 3: disconnecting
        dbError: dbErrorMessage,
        dbCode: dbErrorCode,
        hasUri: !!MONGO_URI,
        uriType: MONGO_URI ? MONGO_URI.split(':')[0] : null,
        environment: process.env.VERCEL ? 'vercel' : 'local',
        timestamp: new Date().toISOString()
    }));
});

// --- API 404 Handler ---
app.use('/api', (req, res) => {
    res.status(404).json({ error: "API Route Not Found", path: req.path, method: req.method });
});

// --- Static File Serving (Local Dev Fallback) ---
if (!process.env.VERCEL) {
    const staticPath = path.join(__dirname, '../dist');
    const devPath = path.join(__dirname, '../client');
    app.use(express.static(staticPath));
    app.use(express.static(devPath));

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

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error('SERVER_ERROR:', err);
    if (req.path.startsWith('/api')) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: err.message,
            stack: process.env.VERCEL ? undefined : err.stack
        });
    }
    res.status(500).send('Internal Server Error: ' + err.message);
});

// --- Server Start ---
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🌍 Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
