const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  category: { type: String, enum: ['smartphone', 'laptop', 'tablet', 'smartwatch'], required: true },
  basePrice: { type: Number, default: 0 },
  image: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique model name per brand
modelSchema.index({ name: 1, brand: 1 }, { unique: true });

module.exports = mongoose.model('Model', modelSchema);
