const mongoose = require('mongoose');

/**
 * Ledger Settings Model
 * Stores initial balance and start date for each shop's daily ledger.
 */
const ledgerSettingsSchema = new mongoose.Schema({
    shop: { type: String, required: true, unique: true },
    initialBalance: { type: Number, default: 0 },
    startDate: { type: Date, required: true }
});

/**
 * Ledger Adjustment Model
 * Stores daily short/extra cash adjustments.
 */
const ledgerAdjustmentSchema = new mongoose.Schema({
    shop: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true }, // Positive for extra, negative for short
    note: { type: String }
});

// Composite index to prevent duplicates for the same shop/day
ledgerAdjustmentSchema.index({ shop: 1, date: 1 }, { unique: true });

const LedgerSettings = mongoose.model('LedgerSettings', ledgerSettingsSchema);
const LedgerAdjustment = mongoose.model('LedgerAdjustment', ledgerAdjustmentSchema);

module.exports = { LedgerSettings, LedgerAdjustment };
