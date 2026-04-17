const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const connectDB = require('../config/db');

const check = async () => {
  try {
    await connectDB();
    const blog = await Blog.findOne({ title: 'hi' });
    console.log('Blog "hi" image field:', blog ? blog.image : 'Blog not found');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
check();
