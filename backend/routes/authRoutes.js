const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let query = {};
    if (role === 'admin') {
      query = { email, role: 'admin' };
    } else {
      query = { $or: [{ email }, { clientId: email }], role: 'client' };
    }
    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      await Activity.create({ userEmail: user.email, role: user.role, action: 'Login' });
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// (Export moved to bottom)
// @route   POST /api/auth/logout
// @desc    Log out user activity
// @access  Public
router.post('/logout', async (req, res) => {
  const { email, role } = req.body;
  try {
    if (email && role) {
      await Activity.create({ userEmail: email, role, action: 'Logout' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
