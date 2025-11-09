const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../model/comment');
const Note = require('../model/note');
const User = require('../model/user');

// Add a comment to a note
router.post('/note/:noteId', auth, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const isOwner = note.user.toString() === req.user._id.toString();

    const comment = new Comment({ note: noteId, author: req.user._id, text, readByOwner: isOwner });
    await comment.save();

    // return populated comment
    const populated = await Comment.findById(comment._id).populate('author', 'firstName lastName email profilePicture');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a note
router.get('/note/:noteId', auth, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const comments = await Comment.find({ note: noteId }).populate('author', 'firstName lastName email profilePicture').sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unread count for current user (owner) across all their notes
router.get('/unread/count', auth, async (req, res) => {
  try {
    // comments where the note belongs to the user and readByOwner is false
    const userId = req.user._id;
    const notes = await Note.find({ user: userId }).select('_id');
    const noteIds = notes.map(n => n._id);
    const count = await Comment.countDocuments({ note: { $in: noteIds }, readByOwner: false, author: { $ne: userId } });
    res.json({ unread: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unread list grouped by note for owner notifications
router.get('/unread/list', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const notes = await Note.find({ user: userId }).select('_id title');
    const noteIds = notes.map(n => n._id);

    const results = await Comment.aggregate([
      { $match: { note: { $in: noteIds }, readByOwner: false, author: { $ne: userId } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$note', count: { $sum: 1 }, lastComment: { $first: '$$ROOT' } } }
    ]);

    const mapped = await Promise.all(results.map(async r => {
      const note = notes.find(n => n._id.toString() === r._id.toString()) || await Note.findById(r._id).select('title');
      const author = await User.findById(r.lastComment.author).select('firstName lastName email profilePicture');
      return { note: r._id, noteTitle: note.title, count: r.count, lastComment: r.lastComment, authorInfo: author };
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark comments on a note as read by owner
router.post('/note/:noteId/mark-read', auth, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.user.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not allowed' });

    await Comment.updateMany({ note: noteId, readByOwner: false }, { $set: { readByOwner: true } });
    const notes = await Note.find({ user: req.user._id }).select('_id');
    const noteIds = notes.map(n => n._id);
    const remaining = await Comment.countDocuments({ note: { $in: noteIds }, readByOwner: false, author: { $ne: req.user._id } });
    res.json({ message: 'Marked', unread: remaining });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Edit a comment (only author can edit)
router.put('/:commentId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not allowed' });

    comment.text = text;
    comment.updatedAt = new Date();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate('author', 'firstName lastName email profilePicture');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get counts for multiple notes by ids
router.get('/counts', auth, async (req, res) => {
  try {
    // noteIds provided as comma-separated query param: ?noteIds=id1,id2
    const noteIdsParam = req.query.noteIds;
    if (!noteIdsParam) return res.status(400).json({ error: 'noteIds query param required' });
    const ids = noteIdsParam.split(',').map(s => s.trim()).filter(Boolean);
    const objectIds = ids.map(id => require('mongoose').Types.ObjectId(id));

    const results = await Comment.aggregate([
      { $match: { note: { $in: objectIds } } },
      { $group: { _id: '$note', count: { $sum: 1 } } }
    ]);

    const map = {};
    results.forEach(r => { map[r._id.toString()] = r.count; });
    // return array of { note, count }
    const out = ids.map(id => ({ note: id, count: map[id] || 0 }));
    res.json(out);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

