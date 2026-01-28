require("dotenv").config();
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require("./config/db");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

// Models
const User = require('./models/User');
const Student = require('./models/Student');

const app = express();

// Connect Database
connectDB();

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://recordmanager.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));
app.options("(.*)", cors(corsOptions)); // 🔥 IMPORTANT for preflight


app.use(express.json()); // Same as bodyParser.json() which express.json() replaces in newer versions

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
        // Allow login with Username or Email
        const user = await User.findOne({
            $or: [{ username }, { email: username }],
            password
        }); // In real app, compare hash
        if (user) {
            // Create JWT Payload
            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET || 'secret',
                { expiresIn: 360000 }, // Sets a long expiration
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: { name: user.username, email: user.email, role: user.role }
                    });
                }
            );
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Forgot Password
// Reset Password (Direct)
app.post('/api/auth/reset-password-direct', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "User not found with that email" });

        user.password = newPassword; // In real app: hash it
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: "Password reset token is invalid or has expired" });

        user.password = newPassword; // In real app: hash it
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Update Profile
app.put('/api/auth/profile/:currentUsername', async (req, res) => {
    try {
        const { currentUsername } = req.params;
        const { username, email } = req.body;

        // Check if new username/email exists (if changed)
        if (username !== currentUsername) {
            const exists = await User.findOne({ username });
            if (exists) return res.status(400).json({ error: "Username already taken" });
        }

        const user = await User.findOneAndUpdate(
            { username: currentUsername },
            { username, email },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ message: "Profile updated", user: { name: user.username, email: user.email, role: user.role } });
    } catch (err) {
        // Handle duplicate key error (e.g., email)
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email already in use" });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// --- Student Routes ---

// Get All
// Get All (Protected)
app.get('/api/students', auth, async (req, res) => {
    try {
        // Find students only for this user
        const students = await Student.find({ user: req.user.id });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Helper to calculate percentage and grade
const calculateStats = (marks) => {
    if (!marks || marks.length === 0) return { percentage: 0, grade: 'F' };

    // Convert Map or Object to array of values
    const values = marks instanceof Map ? Array.from(marks.values()) : Object.values(marks);
    if (values.length === 0) return { percentage: 0, grade: 'F' };

    const total = values.reduce((a, b) => a + Number(b), 0);
    // Assuming each subject is out of 100
    const percentage = (total / values.length).toFixed(2);

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    return { percentage, grade };
};

// Add Student
// Add Student (Protected)
app.post('/api/students', auth, async (req, res) => {
    try {
        const { name, course, marks } = req.body;

        // Auto-increment logic PER USER
        const lastStudent = await Student.findOne({ user: req.user.id }).sort({ rollNumber: -1 });
        const rollNumber = lastStudent ? lastStudent.rollNumber + 1 : 1;

        const { percentage, grade } = calculateStats(marks);

        const newStudent = new Student({
            roomNumber: rollNumber, // Just in case passing it explicitly, though logic above handles it
            rollNumber,
            name,
            course,
            marks,
            percentage,
            grade,
            user: req.user.id // Associate with logged in user
        });
        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Student
// Update Student (Protected)
app.put('/api/students/:rollNumber', auth, async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const { name, course, marks } = req.body;

        const { percentage, grade } = calculateStats(marks);

        // Find by rollNumber AND user to ensure ownership
        const updated = await Student.findOneAndUpdate(
            { rollNumber, user: req.user.id },
            { name, course, marks, percentage, grade },
            { new: true }
        );
        if (updated) res.json(updated);
        else res.status(404).json({ error: "Student not found" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Student
// Delete Student (Protected)
app.delete('/api/students/:rollNumber', auth, async (req, res) => {
    try {
        const { rollNumber } = req.params;
        // Ensure own user
        const deleted = await Student.findOneAndDelete({ rollNumber, user: req.user.id });
        if (deleted) res.json({ message: "Student deleted" });
        else res.status(404).json({ error: "Student not found" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);
