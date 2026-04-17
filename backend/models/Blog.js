const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorSignature: {
    type: String,
    default: 'admin@finpulse.works'
  },
  comments: [{
    text: String,
    user: String,
    date: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});
blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);
