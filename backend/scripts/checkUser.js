const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const checkUser = async () => {
    await connectDB();
    const email = process.argv[2];
    const user = await User.findOne({ email });
    console.log(user ? `User found: ${user.username}` : "User NOT found");
    process.exit();
};

checkUser();
