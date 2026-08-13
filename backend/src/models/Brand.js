const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  category: { type: String, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

brandSchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);
