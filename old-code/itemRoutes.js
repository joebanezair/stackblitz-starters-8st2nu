const express = require('express');
const router = express.Router();
const Item = require('../model/item'); // ✅ import the model

// POST /api/add
router.post('/add', async (req, res) => {
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

// GET /api/items
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    console.log('All Items via /items route:', items);
    res.json(items);
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).send('Fetch failed');
  }
});

module.exports = router; // ✅ export the router
