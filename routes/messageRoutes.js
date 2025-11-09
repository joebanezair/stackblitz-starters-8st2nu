const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../model/message');
const User = require('../model/user');

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    if (!recipientId || !text) return res.status(400).json({ error: 'recipientId and text are required' });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const message = new Message({ sender: req.user._id, recipient: recipientId, text });
    await message.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unread count for current user
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipient: req.user._id, read: false });
    res.json({ unread: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unread counts grouped by sender for current user
router.get('/unread/by-sender', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const results = await Message.aggregate([
      { $match: { recipient: userId, read: false } },
      { $group: { _id: '$sender', count: { $sum: 1 } } }
    ]);

    // map to array of { sender, count }
    const mapped = await Promise.all(results.map(async r => {
      const sender = await User.findById(r._id).select('firstName middleName lastName email profilePicture');
      return { sender: r._id, count: r.count, senderInfo: sender };
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unread list: per-sender counts with last unread message for quick notifications
router.get('/unread/list', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    // find unread messages for recipient, group by sender and get last unread message
    const results = await Message.aggregate([
      { $match: { recipient: userId, read: false } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$sender', count: { $sum: 1 }, lastMessage: { $first: '$$ROOT' } } }
    ]);

    const mapped = await Promise.all(results.map(async r => {
      const sender = await User.findById(r._id).select('firstName middleName lastName email profilePicture');
      return { sender: r._id, count: r.count, lastMessage: r.lastMessage, senderInfo: sender };
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages from partner as read
router.post('/conversation/:userId/mark-read', auth, async (req, res) => {
  try {
    const partnerId = req.params.userId;
    await Message.updateMany({ sender: partnerId, recipient: req.user._id, read: false }, { $set: { read: true } });
    const count = await Message.countDocuments({ recipient: req.user._id, read: false });
    res.json({ message: 'Marked as read', unread: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation between current user and another user
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: otherId },
        { sender: otherId, recipient: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List conversation partners with last message
router.get('/conversations', auth, async (req, res) => {
  try {
    // aggregate last message per conversation partner
    const userId = req.user._id;
    const results = await Message.aggregate([
      { $match: { $or: [ { sender: userId }, { recipient: userId } ] } },
      { $project: { sender: 1, recipient: 1, text: 1, createdAt: 1 } },
      { $addFields: { partner: { $cond: [{ $eq: ['$sender', userId] }, '$recipient', '$sender'] } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$partner', lastMessage: { $first: '$$ROOT' } } }
    ]);

    // populate partner details
    const conversations = await Promise.all(results.map(async r => {
      const partner = await User.findById(r._id).select('firstName middleName lastName email profilePicture');
      return { partner, lastMessage: r.lastMessage };
    }));

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;