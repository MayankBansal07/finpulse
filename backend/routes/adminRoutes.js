const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/admin/clients
// @desc    Admin manually creates a new client
// @access  Private/Admin
router.post('/clients', protect, admin, async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const defaultPassword = password || 'client123';
    
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password: defaultPassword,
      phone,
      role: 'client',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/clients
// @desc    Get all clients
// @access  Private/Admin
router.get('/clients', protect, admin, async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/consultations
// @desc    Get all form submissions
// @access  Private/Admin
router.get('/consultations', protect, admin, async (req, res) => {
  try {
    const consultations = await Consultation.find({}).sort({ createdAt: -1 });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
