const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Replace with your actual credentials
const mongoUri =
  'mongodb://myUserAdmin:myStrongPassword@72.61.114.158:27017/mern_sample?authSource=admin';

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB Connected');

    // Automatically insert some sample data on server start
    insertSampleData();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const ItemSchema = new mongoose.Schema({ name: String });
const Item = mongoose.model('Item', ItemSchema);

// Function to insert sample data and log to console
async function insertSampleData() {
  try {
    const itemsToInsert = [{ name: 'Alice' }, { name: 'Bob' }];

    // Insert documents
    const inserted = await Item.insertMany(itemsToInsert);
    console.log('Inserted sample documents:', inserted);

    // Read all documents
    const allItems = await Item.find();
    console.log('All documents in collection:');
    console.log(allItems);
  } catch (err) {
    console.error('❌ Error inserting sample data:', err);
  }
}

// Route to insert data via POST
app.post('/add', async (req, res) => {
  try {
    const item = new Item({ name: req.body.name });
    await item.save();
    console.log('Inserted via /add route:', item);
    res.send('Data inserted!');
  } catch (err) {
    console.error('❌ Insert error:', err);
    res.status(500).send('Insert failed');
  }
});

// Route to read data via GET
app.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    console.log('All Items via /items route:', items);
    res.json(items);
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).send('Fetch failed');
  }
});

app.listen(3000, () => console.log('🚀 - Server running on port 3000'));
