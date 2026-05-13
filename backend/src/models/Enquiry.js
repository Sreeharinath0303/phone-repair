const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['contact', 'sales', 'support', 'promotional'], 
    default: 'contact',
    required: true 
  },
  
  // Specific fields based on type
  company: String, // For sales
  requirementDetails: String, // For sales
  message: String, // For contact/general
  
  issueType: String, // For support
  description: String, // For support/general
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // For support
  orderReference: String, // Plain text reference if ID not found
  
  interest: String, // For promotional
  campaignSource: String, // For promotional
  
  responses: [{
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    message: String,
    sentAt: { type: Date, default: Date.now }
  }],
  
  status: { 
    type: String, 
    enum: ['new', 'in_progress', 'resolved', 'closed'], 
    default: 'new' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  adminNotes: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

enquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Enquiry', enquirySchema);
