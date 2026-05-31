const mongoose = require('mongoose');

const uri = "mongodb+srv://umark2917:umarkhan@cluster0.illvdq2.mongodb.net/asg?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const conn = mongoose.connection;
    const staralgawaniBookings = conn.collection('staralgawanibookings');
    const galaxyzakhirBookings = conn.collection('galaxyzakhirbookings');

    // Find all 57-series bookings in staralgawani
    const bookingsToMove = await staralgawaniBookings.find({ billNo: { $regex: /^57/ } }).toArray();
    console.log(`Found ${bookingsToMove.length} bookings to move.`);

    if (bookingsToMove.length > 0) {
        // Insert into galaxyzakhirbookings
        const insertResult = await galaxyzakhirBookings.insertMany(bookingsToMove);
        console.log(`Inserted ${insertResult.insertedCount} bookings into galaxyzakhirbookings.`);

        // Delete from staralgawanibookings
        const idsToDelete = bookingsToMove.map(b => b._id);
        const deleteResult = await staralgawaniBookings.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`Deleted ${deleteResult.deletedCount} bookings from staralgawanibookings.`);
    } else {
        console.log("No bookings found to move.");
    }

    mongoose.disconnect();
}

run().catch(console.error);

