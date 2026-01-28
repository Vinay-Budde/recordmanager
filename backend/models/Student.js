const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rollNumber: { type: Number, required: true }, // Removed unique: true, handled by compound index
    name: { type: String, required: true },
    course: { type: String, required: true },
    marks: { type: Map, of: Number }, // Flexible marks object
    percentage: { type: Number },
    grade: { type: String }
});

// Create Compound Index: Roll Number must be unique *per user*
StudentSchema.index({ user: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
