const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

// Generic Schema
const AnySchema = new mongoose.Schema({}, { strict: false });
const GalaxyModels = mongoose.model('GalaxybranchBookings', AnySchema, 'galaxybranchbookings');

async function fixStatus() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const startBill = 4070;
        const endBill = 4085;

        console.log(`Updating status to 'stock' for Bill No ${startBill} - ${endBill} in Galaxybranch...`);

        // Use updateMany for efficiency
        // We assume billNo is stored as String in DB based on previous findings, so we might need regex or just loose matching.
        // But let's try to match them string-wise since filtered previously.
        // Actually, let's fetch first to be sure of types, or just use $in with strings.

        const billsToUpdate = [];
        for (let i = startBill; i <= endBill; i++) {
            billsToUpdate.push(String(i));
        }

        const result = await GalaxyModels.updateMany(
            { billNo: { $in: billsToUpdate } },
            { $set: { status: 'stock' } }
        );

        console.log(`Matched ${result.matchedCount} documents.`);
        console.log(`Modified ${result.modifiedCount} documents.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

fixStatus();
