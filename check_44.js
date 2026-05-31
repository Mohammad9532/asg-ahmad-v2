const mongoose = require('mongoose');

const uri = "mongodb+srv://umark2917:umarkhan@cluster0.illvdq2.mongodb.net/asg?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const conn = mongoose.connection;
    const naseemBookings = conn.collection('naseembookings');
    const staralgawaniBookings = conn.collection('staralgawanibookings');

    const bookingsToMove = await naseemBookings.find({ billNo: { $regex: /^43/ } }).toArray();
    console.log(`Found ${bookingsToMove.length} bookings to move.`);

    if (bookingsToMove.length > 0) {
        // Find if they already exist in staralgawani to prevent duplicates, though _id should catch that.
        try {
            const insertResult = await staralgawaniBookings.insertMany(bookingsToMove);
            console.log(`Inserted ${insertResult.insertedCount} bookings into staralgawanibookings.`);

            const idsToDelete = bookingsToMove.map(b => b._id);
            const deleteResult = await naseemBookings.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted ${deleteResult.deletedCount} bookings from naseembookings.`);
        } catch (e) {
            console.error("Error migrating documents", e);
        }
    } else {
        console.log("No bookings found to move.");
    }

    mongoose.disconnect();
}

run().catch(console.error);
