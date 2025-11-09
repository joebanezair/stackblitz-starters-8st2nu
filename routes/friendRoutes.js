const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Note = require('../model/note');
const auth = require('../middleware/auth');

// Send friend request by email
router.post('/request', auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Prevent sending to self
    if (target._id.equals(req.user._id)) return res.status(400).json({ error: 'Cannot request yourself' });

    const me = await User.findById(req.user._id);

    // Already friends
    if (me.friends && me.friends.some(id => id.equals(target._id))) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Already requested
    if (me.outgoingRequests && me.outgoingRequests.some(id => id.equals(target._id))) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    // If target has sent request to me, auto-accept
    if (me.incomingRequests && me.incomingRequests.some(id => id.equals(target._id))) {
      // accept
      me.incomingRequests = me.incomingRequests.filter(id => !id.equals(target._id));
      me.friends = me.friends || [];
      target.friends = target.friends || [];
      me.friends.push(target._id);
      target.friends.push(me._id);
      await me.save();
      await target.save();
      return res.json({ message: 'Friend request accepted automatically' });
    }

    // Add request
    me.outgoingRequests = me.outgoingRequests || [];
    target.incomingRequests = target.incomingRequests || [];
    me.outgoingRequests.push(target._id);
    target.incomingRequests.push(me._id);

    await me.save();
    await target.save();

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List friends
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'firstName middleName lastName email profilePicture');
    res.json(user.friends || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List incoming requests
router.get('/requests/incoming', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('incomingRequests', 'firstName middleName lastName email profilePicture');
    res.json(user.incomingRequests || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List outgoing requests
router.get('/requests/outgoing', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('outgoingRequests', 'firstName middleName lastName email profilePicture');
    res.json(user.outgoingRequests || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post('/requests/:id/accept', auth, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const me = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);
    if (!me || !requester) return res.status(404).json({ error: 'User not found' });

    // ensure request exists
    if (!me.incomingRequests || !me.incomingRequests.some(id => id.equals(requester._id))) {
      return res.status(400).json({ error: 'No such incoming request' });
    }

    // remove from requests
    me.incomingRequests = me.incomingRequests.filter(id => !id.equals(requester._id));
    requester.outgoingRequests = requester.outgoingRequests.filter(id => !id.equals(me._id));

    // add to friends
    me.friends = me.friends || [];
    requester.friends = requester.friends || [];
    me.friends.push(requester._id);
    requester.friends.push(me._id);

    await me.save();
    await requester.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject friend request
router.post('/requests/:id/reject', auth, async (req, res) => {
  try {
    const requesterId = req.params.id;
    const me = await User.findById(req.user._id);
    const requester = await User.findById(requesterId);
    if (!me || !requester) return res.status(404).json({ error: 'User not found' });

    // ensure request exists
    if (!me.incomingRequests || !me.incomingRequests.some(id => id.equals(requester._id))) {
      return res.status(400).json({ error: 'No such incoming request' });
    }

    // remove from requests
    me.incomingRequests = me.incomingRequests.filter(id => !id.equals(requester._id));
    requester.outgoingRequests = requester.outgoingRequests.filter(id => !id.equals(me._id));

    await me.save();
    await requester.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get friend's notes (only if friend or self)
router.get('/:id/notes', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    // allow if self
    if (req.user._id.equals(targetId)) {
      const notes = await Note.find({ user: targetId }).sort({ createdAt: -1 });
      return res.json(notes);
    }

    // check friendship
    const me = await User.findById(req.user._id);
    const isFriend = me.friends && me.friends.some(id => id.equals(targetId));
    if (!isFriend) return res.status(403).json({ error: 'Not authorized to view this user\'s notes' });

    const notes = await Note.find({ user: targetId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
