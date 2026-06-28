const mongoose = require('mongoose');

const ExpenseMasterSchema = new mongoose.Schema({
    targetId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['employee', 'general'], required: true },
    department: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true, strict: false });

// Export the model explicitly for global usage
const ExpenseMaster = mongoose.models.ExpenseMaster || mongoose.model('ExpenseMaster', ExpenseMasterSchema);

module.exports = { ExpenseMasterSchema, ExpenseMaster };
