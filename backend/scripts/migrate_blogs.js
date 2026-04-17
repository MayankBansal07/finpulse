const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { uploadImage } = require('../config/cloudinary');
const connectDB = require('../config/db');

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to Database');

    const blogs = await Blog.find({});
    console.log(`Found ${blogs.length} blogs to check.`);

    for (const blog of blogs) {
      if (blog.image && blog.image.startsWith('data:image')) {
        console.log(`Migrating image for blog: ${blog.title}`);
        try {
          const cloudinaryUrl = await uploadImage(blog.image);
          blog.image = cloudinaryUrl;
          await blog.save();
          console.log(`Successfully migrated ${blog.title}`);
        } catch (err) {
          console.error(`Failed to migrate ${blog.title}:`, err.message);
        }
      } else {
        console.log(`Skipping blog ${blog.title} (already URL or missing image)`);
      }
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration crashed:', error);
    process.exit(1);
  }
};

migrate();
