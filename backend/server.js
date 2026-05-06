require("dotenv").config();
const express = require("express");
const cors = require('cors');
const connectDB = require("./config/db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('./middleware/auth');

// Models
const User = require('./models/User');
const Student = require('./models/Student');

const app = express();

// Connect Database
connectDB();

// CORS Configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://recordmanager.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified origin.'), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true
}));

app.use(express.json());

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'EduManager API is running' });
});

// ===================
// --- Auth Routes ---
// ===================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validate input
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword, email });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Register error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Allow login with Username or Email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT Payload
        const payload = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'edumanager_secret_key_change_in_prod',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { name: user.username, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Password (Direct - by email, no token required)
app.post('/api/auth/reset-password-direct', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "No account found with that email address" });

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        console.error('Reset password error:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Reset Password (via token - for future email-based reset flow)
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: "Password reset token is invalid or has expired" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error('Reset password (token) error:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Update Profile (Protected)
app.put('/api/auth/profile/:currentUsername', auth, async (req, res) => {
    try {
        const { currentUsername } = req.params;
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required' });
        }

        // Check if new username is taken by another user
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

        res.json({
            message: "Profile updated successfully",
            user: { name: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Profile update error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email already in use" });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// Change Password (Protected)
app.put('/api/auth/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ======================
// --- Student Routes ---
// ======================

// Helper to calculate percentage and grade
const calculateStats = (marks) => {
    if (!marks || (marks instanceof Map && marks.size === 0) || Object.keys(marks).length === 0) {
        return { percentage: 0, grade: 'F' };
    }

    // Convert Map or Object to array of values
    const values = marks instanceof Map ? Array.from(marks.values()) : Object.values(marks);
    if (values.length === 0) return { percentage: 0, grade: 'F' };

    const total = values.reduce((a, b) => a + Number(b), 0);
    const percentage = parseFloat((total / values.length).toFixed(2));

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    return { percentage, grade };
};

// Get All Students (Protected)
app.get('/api/students', auth, async (req, res) => {
    try {
        const students = await Student.find({ user: req.user.id }).sort({ rollNumber: 1 });
        res.json(students);
    } catch (err) {
        console.error('Get students error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Add Student (Protected)
app.post('/api/students', auth, async (req, res) => {
    try {
        const { name, course, marks } = req.body;

        if (!name || !course) {
            return res.status(400).json({ error: 'Name and course are required' });
        }

        if (!marks || Object.keys(marks).length === 0) {
            return res.status(400).json({ error: 'At least one subject mark is required' });
        }

        // Auto-increment roll number per user
        const lastStudent = await Student.findOne({ user: req.user.id }).sort({ rollNumber: -1 });
        const rollNumber = lastStudent ? lastStudent.rollNumber + 1 : 1;

        const { percentage, grade } = calculateStats(marks);

        const newStudent = new Student({
            rollNumber,
            name: name.trim(),
            course: course.trim(),
            marks,
            percentage,
            grade,
            user: req.user.id
        });

        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (err) {
        console.error('Add student error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Update Student (Protected)
app.put('/api/students/:rollNumber', auth, async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const { name, course, marks } = req.body;

        if (!name || !course) {
            return res.status(400).json({ error: 'Name and course are required' });
        }

        if (!marks || Object.keys(marks).length === 0) {
            return res.status(400).json({ error: 'At least one subject mark is required' });
        }

        const { percentage, grade } = calculateStats(marks);

        // Find by rollNumber AND user to ensure ownership
        const updated = await Student.findOneAndUpdate(
            { rollNumber: parseInt(rollNumber), user: req.user.id },
            { name: name.trim(), course: course.trim(), marks, percentage, grade },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: "Student not found or unauthorized" });

        res.json(updated);
    } catch (err) {
        console.error('Update student error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Delete Student (Protected)
app.delete('/api/students/:rollNumber', auth, async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const deleted = await Student.findOneAndDelete({
            rollNumber: parseInt(rollNumber),
            user: req.user.id
        });

        if (!deleted) return res.status(404).json({ error: "Student not found or unauthorized" });

        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error('Delete student error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
    console.log(`✅ EduManager server running on port ${PORT}`)
);
