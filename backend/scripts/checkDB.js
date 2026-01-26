const mongoose = require('mongoose');
require('dotenv').config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edumanager');
        console.log("Connected to:", mongoose.connection.host);

        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const dbs = await admin.listDatabases();
        console.log("Databases:", dbs.databases.map(db => db.name));

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("\nCollections in 'edumanager':", collections.map(c => c.name));

        // Count documents
        if (collections.find(c => c.name === 'users')) {
            const count = await mongoose.connection.db.collection('users').countDocuments();
            console.log(`Documents in 'users': ${count}`);
        }
        if (collections.find(c => c.name === 'students')) {
            const count = await mongoose.connection.db.collection('students').countDocuments();
            console.log(`Documents in 'students': ${count}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkDB();
