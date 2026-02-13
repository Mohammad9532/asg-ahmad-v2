const mongoose = require('mongoose');

const TargetSchema = new mongoose.Schema({
    shop: String,
    year: Number,
    month: Number, // 0-11
    amount: Number
}, { timestamps: true });

module.exports = mongoose.model('Target', TargetSchema);
