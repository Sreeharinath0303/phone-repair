const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  logo: { type: String },
  category: { type: String, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
