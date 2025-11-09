const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../model/user');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);
    
    if (!user) throw new Error();
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({ email, password });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const upload = require('../config/multer');

// Update profile
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const updates = req.body;

    // Update text fields
    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.middleName) user.middleName = updates.middleName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.phoneNumber) user.phoneNumber = updates.phoneNumber;

    // Update profile picture if a new file was uploaded
    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    } else if (updates.profilePicture && updates.profilePicture.startsWith('data:image')) {
      // Handle base64 image data
      const base64Data = updates.profilePicture.split(',')[1];
      const fileName = `${Date.now()}-profile.png`;
      const filePath = `uploads/${fileName}`;
      require('fs').writeFileSync(filePath, base64Data, 'base64');
      user.profilePicture = `/uploads/${fileName}`;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;