const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  clientId: { type: String },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['client', 'admin'], default: 'client' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (this.isNew && this.role === 'client' && !this.clientId) {
    this.clientId = 'FNC-' + Math.floor(1000 + Math.random() * 9000);
  }
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
