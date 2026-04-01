const mongoose = require('mongoose');
require('dotenv').config();
const { ExpenseSchema } = require('./api/_lib/models/Transaction');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    try {
        const StarExpenseModel = mongoose.model('StaralgawaniExpenseModel', ExpenseSchema, 'staralgawaniexpenses');

        const targetEntry = await StarExpenseModel.findOne({
            amount: 330,
            name: { $regex: /a\.d\.n/i }
        });

        if (!targetEntry) {
            console.log("Could not find an entry with Amount 330 and Name A.D.N");
            return;
        }

        console.log("Found Target Entry:");
        console.log(`ID: ${targetEntry._id} | Date: ${targetEntry.date} | Amount: ${targetEntry.amount} | Name: ${targetEntry.name} | Created: ${targetEntry.createdAt}`);

        // Find all expenses created at or after this entry's creation time
        const expensesToMove = await StarExpenseModel.find({
            createdAt: { $gte: targetEntry.createdAt }
        }).sort({ createdAt: 1 }).lean(); // Use lean() to get plain objects

        console.log(`\nFound ${expensesToMove.length} expenses to move.`);

        if (expensesToMove.length === 0) return;

        // The destination model
        const GalaxyExpenseModel = mongoose.model('GalaxybranchExpenseModel', ExpenseSchema, 'galaxybranchexpenses');

        // Prepare documents for insertion (optional: remove _id to let mongo generate new ones if needed, but keeping them is fine too)
        // Let's insert them as-is.

        console.log("Inserting into Galaxybranch...");
        await GalaxyExpenseModel.insertMany(expensesToMove);
        console.log("Insertion successful!");

        // Extract IDs for deletion
        const idsToDelete = expensesToMove.map(e => e._id);

        console.log("Deleting from Staralgawani...");
        const deleteResult = await StarExpenseModel.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`Deletion successful! Removed ${deleteResult.deletedCount} entries.`);

        console.log("Migration complete.");

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
});
