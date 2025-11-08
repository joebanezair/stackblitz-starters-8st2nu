const mongoose = require('mongoose');
const Item = require('../models/item'); // ✅ import the model

const connectionDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Example: read items after connecting
    const items = await Item.find();
    console.log('📘 Current items:', items);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectionDatabase; // ✅ export the function so server.js can use it
