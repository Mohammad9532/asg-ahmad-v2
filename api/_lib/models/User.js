const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'shop'], default: 'shop' },
    shop: { type: String, default: null } // Canonical name like 'Gaidatailor'
});

module.exports = mongoose.model('User', userSchema);
