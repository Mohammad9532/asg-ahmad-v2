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
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        // Generate Token
        const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
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
