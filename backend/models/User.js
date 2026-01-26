const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: 'Admin' },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);
