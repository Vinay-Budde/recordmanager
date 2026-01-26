const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    rollNumber: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    course: { type: String, required: true },
    marks: { type: Map, of: Number } // Flexible marks object
});

module.exports = mongoose.model('Student', StudentSchema);
