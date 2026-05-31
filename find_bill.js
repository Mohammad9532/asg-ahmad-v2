const mongoose = require('mongoose');

const uri = "mongodb+srv://umark2917:umarkhan@cluster0.illvdq2.mongodb.net/asg?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const conn = mongoose.connection;
    const naseemBookings = conn.collection('naseembookings');
    const naseemDeliveries = conn.collection('naseemdeliveries');

    const bookings = await naseemBookings.find({ billNo: { $regex: /^16/ } }).toArray();
    console.log("Found bookings in Naseem:", bookings);

    const relatedBills = bookings.map(b => b.billNo);

    if (relatedBills.length > 0) {
        const deliveries = await naseemDeliveries.find({ billNo: { $in: relatedBills } }).toArray();
        console.log("Found related deliveries in Naseem:", deliveries);
    }

    mongoose.disconnect();
}

run().catch(console.error);
