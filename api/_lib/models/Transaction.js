const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    billNo: { type: String, index: true },
    name: String,
    date: { type: Date, required: true, index: true },
    countryCode: String,
    phone: String,
    qty: Number,
    amount: { type: Number, required: true },
    noOfUpdates: { type: Number, default: 0 },
    status: String
}, { timestamps: true, strict: false });

const DeliverySchema = new mongoose.Schema({
    billNo: { type: String, index: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, index: true },
    amountType: String,
    noOfUpdates: { type: Number, default: 0 }
}, { timestamps: true, strict: false });

const ExpenseSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true, index: true },
    dept: String,
    cat: String,
    name: String,
    targetId: String,
    expenseType: { type: String, enum: ['employee', 'general'] },
    noOfUpdates: { type: Number, default: 0 }
}, { timestamps: true, strict: false });

module.exports = { BookingSchema, DeliverySchema, ExpenseSchema };
