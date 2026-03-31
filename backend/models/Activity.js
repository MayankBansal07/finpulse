const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Activity', activitySchema);
