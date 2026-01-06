const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

// Generic Schema to match any booking
const AnySchema = new mongoose.Schema({}, { strict: false });

const SourceModel = mongoose.model('GaidatailorBookings', AnySchema, 'gaidatailorbookings');
const TargetModel = mongoose.model('GalaxybranchBookings', AnySchema, 'galaxybranchbookings');

async function migrateData() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const startBill = "3929";
        const endBill = "3940";

        // Find docs to move
        // Note: billNo is likely a string based on loose schema, but checking regex or range if it's a number
        // Just in case billNo is stored as String vs Number, let's try to handle broadly.
        // Assuming string based on typical "Bill No" usage, but usually people type numbers.
        // Let's fetch all and filter in JS to be safe about types.

        console.log(`Searching for bills ${startBill} to ${endBill} in Gaidatailor...`);

        const allDocs = await SourceModel.find({});

        const docsToMove = allDocs.filter(d => {
            // Flexible check: handle string or number
            const b = parseInt(d.billNo);
            return b >= 3929 && b <= 3940;
        });

        console.log(`Found ${docsToMove.length} documents.`);

        if (docsToMove.length === 0) {
            console.log("No documents found. Exiting.");
            process.exit(0);
        }

        for (const doc of docsToMove) {
            const docObj = doc.toObject();
            delete docObj._id; // Remove _id to let Mongo generate a new one for the target, or keep it? 
            // Better to delete _id to avoid collision if IDs happen to conflict (unlikely with ObjectId but safer)
            // Or better, keep it unique? No, new collection, new ID is safer.

            console.log(`Moving Bill: ${docObj.billNo} (${docObj.name || 'No Name'})`);

            await TargetModel.create(docObj);
            await SourceModel.findByIdAndDelete(doc._id);
            console.log(` > Moved & Deleted.`);
        }

        console.log("Migration Complete.");

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

migrateData();
