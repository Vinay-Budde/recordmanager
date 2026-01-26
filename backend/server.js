const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Models
const User = require('./models/User');
const Student = require('./models/Student');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/edumanager', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        // In real app, hash password here using bcrypt
        const newUser = new User({ username, password, email });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Username already exists or invalid data' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password }); // In real app, compare hash
        if (user) {
            res.json({ message: 'Login successful', user: { name: user.username, email: user.email, role: user.role } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Student Routes ---

// Get All
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Student
app.post('/api/students', async (req, res) => {
    try {
        const { name, course, marks } = req.body;

        // Auto-increment logic using aggregation
        const lastStudent = await Student.findOne().sort({ rollNumber: -1 });
        const rollNumber = lastStudent ? lastStudent.rollNumber + 1 : 1;

        const newStudent = new Student({ rollNumber, name, course, marks });
        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Student
app.put('/api/students/:rollNumber', async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const updated = await Student.findOneAndUpdate({ rollNumber }, req.body, { new: true });
        if (updated) res.json(updated);
        else res.status(404).json({ error: "Student not found" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Node Server started on port ${PORT}`);
});
