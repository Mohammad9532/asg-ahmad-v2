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
// Path: /api/health (Unprotected)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Mount all modular routes under /api
app.use('/api/auth', authRoutes); // Health check is also here under /api/auth/health
app.use('/api', ledgerRoutes);    // Handles /api/:shop/ledger/settings etc.
app.use('/api', analyticsRoutes); // Handles /api/targets and /api/analytics/compare
app.use('/api', aiRoutes);        // Handles /api/ai/chat
app.use('/api', globalRoutes);    // Handles /api/global/summary
app.use('/api', shopRoutes);      // Handles dynamic shop routes: /api/:shop/bookings/summary etc.

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully!');
        seedAdminUser();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error. Check your .env file.', err.message);
        process.exit(1);
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
