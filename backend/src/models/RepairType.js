const mongoose = require('mongoose');

const repairTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch', 'general'], default: 'general' },
  estimatedPrice: { type: Number, default: 0 },
  estimatedTime: { type: String, default: '2-4 Hours' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('RepairType', repairTypeSchema);
