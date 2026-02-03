const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Atlas connected");

        // --- AUTO-FIX: Drop legacy index if exists ---
        try {
            const collection = mongoose.connection.collection('students');
            const indexes = await collection.indexes();
            const badIndex = indexes.find(idx => idx.name === 'rollNumber_1');
            if (badIndex) {
                console.log("Found legacy 'rollNumber_1' index. Dropping it...");
                await collection.dropIndex('rollNumber_1');
                console.log("Legacy index 'rollNumber_1' dropped successfully.");
            }
        } catch (idxErr) {
            console.log("Note: Auto-fix for indexes skipped or failed (safe to ignore if not needed):", idxErr.message);
        }
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
