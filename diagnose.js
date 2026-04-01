const mongoose = require('mongoose');
require('dotenv').config();
const { BookingSchema, DeliverySchema } = require('./api/_lib/models/Transaction');
const { AuditSchema } = require('./api/_lib/models/Audit');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;

async function run() {
    await mongoose.connect(MONGO_URI);
    const shop = 'staralgawani';
    const collectionPrefix = shop.toLowerCase();

    const BookingModel = mongoose.model('StaralgawaniBookingsModel', BookingSchema, `${collectionPrefix}bookings`);
    const DeliveryModel = mongoose.model('StaralgawaniDeliveryModel', DeliverySchema, `${collectionPrefix}deliveries`);
    const AuditModel = mongoose.model('StaralgawaniAuditModel', AuditSchema, `${collectionPrefix}audit`);

    const startDate = new Date('2025-06-08T00:00:00.000Z');
    const endDate = new Date('2026-03-19T23:59:59.999Z');

    // 1. Get all bookings in range
    const bookings = await BookingModel.find({
        date: { $gte: startDate, $lte: endDate },
        billNo: { $exists: true, $ne: 'other-amounts' }
    }).lean();

    const billNos = bookings.map(b => String(b.billNo).trim());
    const deliveries = await DeliveryModel.find({ billNo: { $in: billNos } }).lean();
    const deliveryMap = {};
    deliveries.forEach(d => {
        const b = String(d.billNo).trim();
        deliveryMap[b] = (deliveryMap[b] || 0) + (d.amount || 0);
    });

    // 2. Get all audit records for these bills
    const auditRecords = await AuditModel.find({ billNo: { $in: billNos } }).lean();
    const auditMap = {};
    auditRecords.forEach(a => {
        auditMap[String(a.billNo).trim()] = a;
    });

    let manualDiff = 0;
    const offenders = [];

    bookings.forEach(b => {
        const bNo = String(b.billNo).trim();
        const audit = auditMap[bNo];
        if (!audit) return; // Not checked yet

        const calculatedBalance = (b.amount || 0) - (deliveryMap[bNo] || 0);
        const actualAuditAmount = audit.amount || 0;

        if (Math.abs(actualAuditAmount - calculatedBalance) > 0.01) {
            offenders.push({
                billNo: bNo,
                calculated: calculatedBalance,
                actual: actualAuditAmount,
                diff: actualAuditAmount - calculatedBalance
            });
            manualDiff += (actualAuditAmount - calculatedBalance);
        }
    });

    console.log(`Total Manual Edits found: ${offenders.length}`);
    console.log(`Total Manual Diff: ${manualDiff}`);
    console.log("\nOffenders:");
    offenders.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 10).forEach(o => {
        console.log(`Bill: ${o.billNo}, Calc: ${o.calculated}, Actual: ${o.actual}, Diff: ${o.diff}`);
    });

    process.exit(0);
}

run();
