const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    billNo: { type: String, index: true }, // Store as String to match other schemas
    remark: String,
    qty: Number,
    missingPcs: Number,
    amount: Number, // Balance Amount at time of audit
    batchLabel: String, // Name of the audit batch (e.g. "Year End 2024")
    checkedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Checked' } // 'Checked' or 'Archived'
}, { timestamps: true, strict: false });

module.exports = { AuditSchema };
