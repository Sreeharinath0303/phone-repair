const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  businessName: { type: String, required: true, default: 'Independent Technician' },
  email:        { type: String, required: true, unique: true },
  phone:        { type: String, required: true },
  password:     { type: String, select: false },
  address:      { type: String, default: '' },
  city:         { type: String, default: '' },
  state:        { type: String, default: '' },
  pincode:      { type: String, default: '' },
  specialization: { type: String, required: false, default: 'General Repairs' },
  supportedBrands: [{ type: String }],
  supportedCategories: [{ type: String }],
  serviceAreas: [{ type: String }],
  status:       { type: String, enum: ['available', 'busy', 'off'], default: 'available' },
  
  // Performance
  totalRepairs: { type: Number, default: 0 },
  completedRepairs: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  
  // Financials
  payoutBalance: { type: Number, default: 0 },
  totalEarned:   { type: Number, default: 0 },
  commissionRate: { type: Number, default: 10 }, // Percentage per repair
  
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

// Hash password
technicianSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('Technician', technicianSchema);
