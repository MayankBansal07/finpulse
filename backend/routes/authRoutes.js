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

const { protect } = require('../middleware/auth');
// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// @route   PUT /api/auth/profile/gst
// @desc    Update current user GST records
// @access  Private
router.put('/profile/gst', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.gstData = req.body.gstData || user.gstData;
      user.gstSalesData = req.body.gstSalesData || user.gstSalesData;
      user.salesHTML = req.body.salesHTML || user.salesHTML;
      user.purchasesHTML = req.body.purchasesHTML || user.purchasesHTML;
      user.expensesHTML = req.body.expensesHTML || user.expensesHTML;
      
      await user.save();
      res.json({ message: 'GST records updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/auth/profile/gst
// @desc    Clear current user GST records
// @access  Private
router.delete('/profile/gst', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.gstData = { revenue: 0, expenses: 0, profit: 0, tax: 0 };
      user.gstSalesData = [];
      user.salesHTML = '';
      user.purchasesHTML = '';
      user.expensesHTML = '';
      
      await user.save();
      res.json({ message: 'GST records cleared successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
