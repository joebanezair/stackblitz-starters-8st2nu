const express = require('express');
const router = express.Router();
const Note = require('../model/note');
const auth = require('../middleware/auth');

// Get all notes for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new note
router.post('/', auth, async (req, res) => {
  try {
    const note = new Note({
      ...req.body,
      user: req.user._id
    });
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a note
router.put('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'content'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates!' });
  }

  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    updates.forEach(update => note[update] = req.body[update]);
    await note.save();
    res.json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;