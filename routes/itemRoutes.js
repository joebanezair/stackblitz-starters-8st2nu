const express = require('express');
const router = express.Router();
const Item = require('../model/item'); // import the model

// 🟩 CREATE — POST /api/add
router.post('/add', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const item = new Item({ name });
    await item.save();

    console.log('✅ Inserted:', item);
    res.status(201).json({ message: 'Data inserted!', data: item });
  } catch (err) {
    console.error('❌ Insert error:', err);
    res.status(500).json({ message: 'Insert failed', error: err.message });
  }
});

// 🟦 READ — GET /api/items
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    console.log('✅ Retrieved all items:', items);
    res.json(items);
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ message: 'Fetch failed', error: err.message });
  }
});

// 🟨 UPDATE — PUT /api/update/:id
router.put('/update/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    console.log('✅ Updated item:', updatedItem);
    res.json({ message: 'Item updated successfully', data: updatedItem });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// 🟥 DELETE — DELETE /api/delete/:id
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await Item.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    console.log('🗑️ Deleted item:', deletedItem);
    res.json({ message: 'Item deleted successfully', data: deletedItem });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

module.exports = router;
