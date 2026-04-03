const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const Blog = require('../models/Blog');
const Activity = require('../models/Activity');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/admin/clients
// @desc    Admin manually creates a new client
// @access  Private/Admin
router.post('/clients', protect, admin, async (req, res) => {
  let email = req.body.email;
  const { name, password, phone } = req.body;

  try {
    const defaultPassword = password || 'client123';
    
    if (!email || email.trim() === '') {
      email = `client-${Date.now()}@finpulse.local`;
    }

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

// @route   DELETE /api/admin/clients/:id
router.delete('/clients/:id', protect, admin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/clients/:id/password
router.put('/clients/:id/password', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.password = req.body.password;
      await user.save(); 
      await Activity.create({ userEmail: req.user.email, role: 'admin', action: 'Updated Pass' });
      res.json({ message: 'Password updated' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/blogs
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 }).allowDiskUse(true);
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/blogs/:id
router.get('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/blogs
router.post('/blogs', protect, admin, async (req, res) => {
  try {
    const { title, content, image } = req.body;
    const blog = await Blog.create({ title, content, image });
    await Activity.create({ userEmail: req.user.email, role: 'admin', action: 'Created Blog' });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/blogs/:id
router.delete('/blogs/:id', protect, admin, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    await Activity.create({ userEmail: req.user.email, role: 'admin', action: 'Deleted Blog' });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/blogs/:id/comments
router.post('/blogs/:id/comments', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    
    // basic comment object
    const comment = {
      text: req.body.text,
      user: req.body.user || 'Anonymous',
    };
    
    blog.comments.push(comment);
    await blog.save();
    
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/activities
router.get('/activities', protect, admin, async (req, res) => {
  try {
    const activities = await Activity.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const publishedBlogs = await Blog.countDocuments();
    res.json({ totalClients, totalAdmins, publishedBlogs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
