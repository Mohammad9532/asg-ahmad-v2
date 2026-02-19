/**
 * Utility script to drop stale indexes.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;

async function cleanup() {
    if (!MONGO_URI) {
        console.error('MONGO_URI not found.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const collection = mongoose.connection.db.collection('users');

        console.log('Current indexes:', await collection.listIndexes().toArray());

        try {
            await collection.dropIndex('email_1');
            console.log('✅ Successfully dropped stale index "email_1"');
        } catch (e) {
            console.log('ℹ️ Index "email_1" not found or already dropped.');
        }

    } catch (err) {
        console.error('Cleanup error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanup();
