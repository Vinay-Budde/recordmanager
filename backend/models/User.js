const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    role: {
        type: String,
        default: 'Admin',
        enum: ['Admin', 'Teacher', 'Staff']
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    collection: 'users',
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
