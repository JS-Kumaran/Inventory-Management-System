require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });