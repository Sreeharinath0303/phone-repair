const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  phone:        { type: String, required: true },
  specialization: { type: String, required: true },
  status:       { type: String, enum: ['available', 'busy', 'off'], default: 'available' },
  totalRepairs: { type: Number, default: 0 },
  completedRepairs: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Technician', technicianSchema);
