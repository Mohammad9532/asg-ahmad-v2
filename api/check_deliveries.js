const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://umark2917:umarkhan@cluster0.illvdq2.mongodb.net/asg?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(MONGO_URI);

    // We can just use raw collection
    const deliveriesCollection = mongoose.connection.collection('gaidamnasirdeliveries');

    const results = await deliveriesCollection.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    amountType: { $toUpper: { $trim: { input: { $ifNull: ["$amountType", "CASH"] } } } }
                },
                totalAmount: { $sum: "$amount" }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1 }
        }
    ]).toArray();

    // Group by month
    const monthlyData = {};
    for (const r of results) {
        const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
        if (!monthlyData[key]) monthlyData[key] = { CASH: 0, ATM: 0, ADIB: 0, OTHER: 0 };

        let type = r._id.amountType;
        if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER') || type.includes('ADIB')) type = 'ADIB';
        if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';

        monthlyData[key][type] += r.totalAmount;
    }

    console.log(JSON.stringify(monthlyData, null, 2));
    process.exit(0);
}

run().catch(console.error);
