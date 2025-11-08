require('dotenv').config();
const mongoose = require('mongoose');

const connectionDataBase = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        console.log('✅ MongoDB Connected');
    } catch (errorpage) {
        console.log("Some errors occured : ", errorpage);
        process.exit(1);
    }
}