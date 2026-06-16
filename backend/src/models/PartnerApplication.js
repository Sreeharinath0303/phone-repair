const mongoose = require('mongoose');

const partnerApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  businessName: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  pincode: { type: String, required: false },
  specialization: { type: String, required: true },
  serviceAreas: [{ type: String }],
  experienceYears: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminNotes: { type: String, default: '' }
}, { timestamps: true });

// Ensure we can search easily
partnerApplicationSchema.index({ name: 'text', email: 1, phone: 1, city: 1 });

module.exports = mongoose.model('PartnerApplication', partnerApplicationSchema);
