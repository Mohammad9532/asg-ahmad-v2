const mongoose = require('mongoose');

const uri = "mongodb+srv://umark2917:umarkhan@cluster0.illvdq2.mongodb.net/asg?retryWrites=true&w=majority";

async function run() {
    await mongoose.connect(uri);
    // Get the 19 most recently inserted 57-series bills (sorted by _id desc = insertion time desc)
    const docs = await mongoose.connection.collection('galaxyzakhirbookings')
        .find({ billNo: { $regex: /^57/ } }, { projection: { billNo: 1, name: 1, _id: 1 } })
        .sort({ _id: -1 })
        .limit(19)
        .toArray();

    // Re-sort ascending by billNo for display
    docs.sort((a, b) => String(a.billNo).localeCompare(String(b.billNo), undefined, { numeric: true }));

    console.log(`Transferred bills (19 total):\n`);
    docs.forEach((d, i) => console.log(`${i + 1}. Bill No: ${d.billNo}  |  Name: ${d.name || '-'}`));
    mongoose.disconnect();
}

run().catch(console.error);
