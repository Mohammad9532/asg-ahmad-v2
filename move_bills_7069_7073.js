const mongoose = require('mongoose');

const uri = "mongodb+srv://umark2917:umarkhan@cluster0.illvdq2.mongodb.net/asg?retryWrites=true&w=majority";

const billsToMove = ['7069', '7070', '7071', '7072', '7073'];

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const conn = mongoose.connection;
    const sourceBookings = conn.collection('algaidamadambookings');
    const destBookings = conn.collection('gawanimadambookings');
    const sourceDeliveries = conn.collection('algaidamadamdeliveries');
    const destDeliveries = conn.collection('gawanimadamdeliveries');

    // Move Bookings
    const bookingsToMove = await sourceBookings.find({ billNo: { $in: billsToMove } }).toArray();
    console.log(`Found ${bookingsToMove.length} bookings to move.`);

    if (bookingsToMove.length > 0) {
        try {
            const insertResult = await destBookings.insertMany(bookingsToMove);
            console.log(`Inserted ${insertResult.insertedCount} bookings into gawanimadambookings.`);

            const idsToDelete = bookingsToMove.map(b => b._id);
            const deleteResult = await sourceBookings.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted ${deleteResult.deletedCount} bookings from algaidamadambookings.`);
        } catch (e) {
            console.error("Error moving bookings", e);
        }
    }

    // Move Deliveries
    const deliveriesToMove = await sourceDeliveries.find({ billNo: { $in: billsToMove } }).toArray();
    console.log(`Found ${deliveriesToMove.length} deliveries to move.`);

    if (deliveriesToMove.length > 0) {
        try {
            const insertResult = await destDeliveries.insertMany(deliveriesToMove);
            console.log(`Inserted ${insertResult.insertedCount} deliveries into gawanimadamdeliveries.`);

            const idsToDelete = deliveriesToMove.map(d => d._id);
            const deleteResult = await sourceDeliveries.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted ${deleteResult.deletedCount} deliveries from algaidamadamdeliveries.`);
        } catch (e) {
            console.error("Error moving deliveries", e);
        }
    }

    mongoose.disconnect();
}

run().catch(console.error);
