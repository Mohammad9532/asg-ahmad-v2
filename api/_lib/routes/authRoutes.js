const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// 1. Auth Endpoints (unprotected)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`[AUTH] Login attempt for user: ${username}`);

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const user = await User.findOne({ username });
        if (!user) {
            console.warn(`[AUTH] User not found: ${username}`);
            return res.status(400).json({ error: "User not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.warn(`[AUTH] Invalid password for user: ${username}`);
            return res.status(400).json({ error: "Invalid password" });
        }

        // Generate Token
        if (!JWT_SECRET) {
            throw new Error("Internal Configuration Error: JWT_SECRET is missing.");
        }

        const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        console.log(`[AUTH] Login successful for: ${username}`);
        res.json({ token, username: user.username });
    } catch (err) {
        console.error("[AUTH_CATCH_ERROR]:", err);
        res.status(500).json({
            error: "Login failed",
            message: err.message,
            tip: "Check server logs for more details."
        });
    }
});

/**
 * --- Seed Admin User ---
 */
const seedAdminUser = async () => {
    try {
        const hashedPassword = await bcrypt.hash('asg@0259', 10);
        await User.findOneAndUpdate(
            { username: 'admin' },
            { username: 'admin', password: hashedPassword },
            { upsert: true }
        );
        console.log("✅ Admin user updated (admin / asg@0259)");
    } catch (err) {
        console.error("Failed to seed admin user:", err);
    }
};

module.exports = { authRoutes: router, seedAdminUser };
