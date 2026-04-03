const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://admin:9680%40Pass@finpulse.6oaepai.mongodb.net/?appName=Finpulse')
  .then(async () => {
    try {
      const db = mongoose.connection.db;
      console.log('Connected to MongoDB');
      await db.collection('blogs').createIndex({ createdAt: -1 });
      const blogs = await db.collection('blogs').find().sort({ createdAt: -1 }).toArray();
      console.log('Found', blogs.length, 'blogs');
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      mongoose.disconnect();
    }
  });
