/**
 * CLI Script to create a new user account.
 * Usage: node scripts/create-user.js <username> <password> <role> [shop]
 * Example: node scripts/create-user.js manager pass123 shop Gaidatailor
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Try to find the model relative to this script
const User = require('../api/_lib/models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;

async function createUser() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log('Usage: node scripts/create-user.js <username> <password> <role> [shop]');
        console.log('Roles: admin, shop');
        process.exit(1);
    }

    const [username, password, role, shop] = args;

    if (!['admin', 'shop'].includes(role)) {
        console.error('Invalid role. Must be "admin" or "shop".');
        process.exit(1);
    }

    if (!MONGO_URI) {
        console.error('MONGO_URI not found in .env file.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.error(`User "${username}" already exists.`);
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
            role,
            shop: role === 'shop' ? shop : undefined
        });

        await newUser.save();
        console.log(`✅ User "${username}" created successfully with role "${role}"${shop ? ' for shop "' + shop + '"' : ''}.`);

    } catch (err) {
        console.error('Error creating user:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createUser();
