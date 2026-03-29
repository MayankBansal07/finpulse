const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  service: { type: String },
  message: { type: String },
  status: { type: String, enum: ['New', 'Contacted', 'Resolved'], default: 'New' }
}, { timestamps: true });

const Consultation = mongoose.model('Consultation', consultationSchema);

module.exports = Consultation;
